package com.bikehub.service.impl;

import com.bikehub.dto.request.ChatMessageRequest;
import com.bikehub.dto.response.*;
import com.bikehub.entity.*;
import com.bikehub.enums.ActionType;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.*;
import com.bikehub.service.ChatService;
import com.bikehub.service.NotificationService;
import com.bikehub.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final BikeRepository bikeRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final UserActivityService userActivityService;

    @Override
    @Transactional
    public ChatRoomResponse getOrCreateRoom(Long buyerId, Long bikeId) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + bikeId));

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer not found with id: " + buyerId));

        User seller = bike.getSeller();

        if (buyer.getId().equals(seller.getId())) {
            throw new BadRequestException("You cannot start a chat room for your own motorcycle listing");
        }

        ChatRoom room = chatRoomRepository.findByBuyerIdAndSellerIdAndBikeId(buyer.getId(), seller.getId(), bike.getId())
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.builder()
                            .buyer(buyer)
                            .seller(seller)
                            .bike(bike)
                            .build();
                    return chatRoomRepository.save(newRoom);
                });

        // Track CHAT interest for AI recommendation
        userActivityService.logActivity(buyerId, bikeId, ActionType.CHAT, null);

        return mapToRoomResponse(room, buyerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getUserRooms(Long userId) {
        List<ChatRoom> rooms = chatRoomRepository.findUserChatRooms(userId);
        return rooms.stream().map(room -> mapToRoomResponse(room, userId)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getRoomMessages(Long requesterId, Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found with id: " + roomId));

        if (!room.getBuyer().getId().equals(requesterId) && !room.getSeller().getId().equals(requesterId)) {
            throw new UnauthorizedException("You are not a participant in this chat room");
        }

        List<ChatMessage> messages = chatMessageRepository.findByChatRoomIdOrderBySentAtAsc(roomId);
        return messages.stream().map(this::mapToMessageResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(Long senderId, ChatMessageRequest request) {
        ChatRoom room = chatRoomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found with id: " + request.getRoomId()));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + senderId));

        if (!room.getBuyer().getId().equals(senderId) && !room.getSeller().getId().equals(senderId)) {
            throw new UnauthorizedException("You do not have permission to send messages in this room");
        }

        ChatMessage message = ChatMessage.builder()
                .chatRoom(room)
                .sender(sender)
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageResponse response = mapToMessageResponse(saved);

        // Real-time broadcast over STOMP WebSocket topic
        try {
            messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), response);
            log.info("Broadcasted chat message to /topic/chat/{}", room.getId());
        } catch (Exception e) {
            log.warn("Could not broadcast message over WebSocket: {}", e.getMessage());
        }

        // Notify the recipient user
        Long recipientId = room.getBuyer().getId().equals(senderId) ? room.getSeller().getId() : room.getBuyer().getId();
        notificationService.sendNotification(
                recipientId,
                "NEW_CHAT_MESSAGE",
                sender.getName() + " sent you a message: \"" + (request.getContent().length() > 40 ? request.getContent().substring(0, 40) + "..." : request.getContent()) + "\""
        );

        return response;
    }

    @Override
    @Transactional
    public void markRoomAsRead(Long readerId, Long roomId) {
        chatMessageRepository.markRoomMessagesAsRead(roomId, readerId);
    }

    private ChatRoomResponse mapToRoomResponse(ChatRoom room, Long currentUserId) {
        Bike bike = room.getBike();
        String primaryImg = null;
        if (bike.getImages() != null && !bike.getImages().isEmpty()) {
            primaryImg = bike.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(BikeImage::getImageUrl)
                    .findFirst()
                    .orElse(bike.getImages().get(0).getImageUrl());
        }

        BikeSummaryResponse bikeSummary = BikeSummaryResponse.builder()
                .id(bike.getId())
                .brand(bike.getBrand())
                .model(bike.getModel())
                .year(bike.getYear())
                .price(bike.getPrice())
                .city(bike.getCity())
                .primaryImageUrl(primaryImg)
                .status(bike.getStatus())
                .build();

        User buyer = room.getBuyer();
        UserSummaryResponse buyerSummary = UserSummaryResponse.builder()
                .id(buyer.getId())
                .name(buyer.getName())
                .email(buyer.getEmail())
                .phone(buyer.getPhone())
                .build();

        User seller = room.getSeller();
        SellerProfile sp = seller.getSellerProfile();
        SellerSummaryResponse sellerSummary = SellerSummaryResponse.builder()
                .id(seller.getId())
                .name(seller.getName())
                .email(seller.getEmail())
                .phone(seller.getPhone())
                .shopName(sp != null ? sp.getShopName() : null)
                .city(sp != null ? sp.getCity() : null)
                .verificationStatus(sp != null ? sp.getVerificationStatus() : null)
                .build();

        Optional<ChatMessage> lastMsgOpt = chatMessageRepository.findFirstByChatRoomIdOrderBySentAtDesc(room.getId());
        String lastMsg = lastMsgOpt.map(ChatMessage::getContent).orElse(null);
        var lastMsgTime = lastMsgOpt.map(ChatMessage::getSentAt).orElse(null);
        long unreadCount = chatMessageRepository.countUnreadMessages(room.getId(), currentUserId);

        return ChatRoomResponse.builder()
                .id(room.getId())
                .bike(bikeSummary)
                .buyer(buyerSummary)
                .seller(sellerSummary)
                .lastMessage(lastMsg)
                .lastMessageTime(lastMsgTime)
                .unreadCount(unreadCount)
                .build();
    }

    private ChatMessageResponse mapToMessageResponse(ChatMessage msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .roomId(msg.getChatRoom().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getName())
                .content(msg.getContent())
                .sentAt(msg.getSentAt())
                .isRead(msg.getIsRead())
                .build();
    }
}
