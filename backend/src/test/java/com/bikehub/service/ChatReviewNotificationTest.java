package com.bikehub.service;

import com.bikehub.dto.request.ChatMessageRequest;
import com.bikehub.dto.request.CreateReviewRequest;
import com.bikehub.dto.response.ChatMessageResponse;
import com.bikehub.dto.response.ChatRoomResponse;
import com.bikehub.dto.response.NotificationResponse;
import com.bikehub.dto.response.ReviewResponse;
import com.bikehub.entity.*;
import com.bikehub.enums.BikeStatus;
import com.bikehub.enums.Role;
import com.bikehub.enums.UserStatus;
import com.bikehub.exception.BadRequestException;
import com.bikehub.repository.*;
import com.bikehub.service.impl.ChatServiceImpl;
import com.bikehub.service.impl.NotificationServiceImpl;
import com.bikehub.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatReviewNotificationTest {

    @Mock
    private ChatRoomRepository chatRoomRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private BikeRepository bikeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserActivityService userActivityService;

    @InjectMocks
    private ChatServiceImpl chatService;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    @InjectMocks
    private NotificationServiceImpl realNotificationService;

    private User sampleBuyer;
    private User sampleSeller;
    private Bike sampleBike;
    private ChatRoom sampleRoom;

    @BeforeEach
    void setUp() {
        sampleBuyer = User.builder()
                .id(4L)
                .name("Buyer Amit")
                .email("buyer.amit@gmail.com")
                .role(Role.BUYER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleSeller = User.builder()
                .id(2L)
                .name("Seller Rajesh")
                .email("seller.rajesh@bikehub.com")
                .role(Role.SELLER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleBike = Bike.builder()
                .id(1L)
                .seller(sampleSeller)
                .brand("Royal Enfield")
                .model("Classic 350")
                .price(new BigDecimal("165000.00"))
                .status(BikeStatus.AVAILABLE)
                .images(new ArrayList<>())
                .build();

        sampleRoom = ChatRoom.builder()
                .id(10L)
                .buyer(sampleBuyer)
                .seller(sampleSeller)
                .bike(sampleBike)
                .build();
    }

    @Test
    void getOrCreateRoom_WhenDifferentBuyerAndSeller_Success() {
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));
        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleBuyer));
        when(chatRoomRepository.findByBuyerIdAndSellerIdAndBikeId(4L, 2L, 1L)).thenReturn(Optional.of(sampleRoom));

        ChatRoomResponse response = chatService.getOrCreateRoom(4L, 1L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Classic 350", response.getBike().getModel());
        verify(userActivityService, times(1)).logActivity(eq(4L), eq(1L), any(), any());
    }

    @Test
    void getOrCreateRoom_WhenBuyerIsSeller_ThrowsBadRequestException() {
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));
        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleSeller));

        assertThrows(BadRequestException.class, () -> chatService.getOrCreateRoom(2L, 1L));
    }

    @Test
    void sendMessage_WhenValid_SavesAndBroadcasts() {
        ChatMessageRequest request = ChatMessageRequest.builder()
                .roomId(10L)
                .content("Is the price negotiable?")
                .build();

        ChatMessage savedMessage = ChatMessage.builder()
                .id(100L)
                .chatRoom(sampleRoom)
                .sender(sampleBuyer)
                .content("Is the price negotiable?")
                .sentAt(LocalDateTime.now())
                .isRead(false)
                .build();

        when(chatRoomRepository.findById(10L)).thenReturn(Optional.of(sampleRoom));
        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleBuyer));
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(savedMessage);

        ChatMessageResponse response = chatService.sendMessage(4L, request);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Is the price negotiable?", response.getContent());
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/chat/10"), any(ChatMessageResponse.class));
        verify(notificationService, times(1)).sendNotification(eq(2L), anyString(), anyString());
    }

    @Test
    void createReview_WhenValid_SavesAndNotifiesSeller() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .sellerId(2L)
                .bikeId(1L)
                .rating(5)
                .comment("Great motorcycle and honest seller!")
                .build();

        Review savedReview = Review.builder()
                .id(50L)
                .reviewer(sampleBuyer)
                .seller(sampleSeller)
                .bike(sampleBike)
                .rating(5)
                .comment("Great motorcycle and honest seller!")
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleBuyer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleSeller));
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));
        when(reviewRepository.existsByReviewerIdAndSellerIdAndBikeId(4L, 2L, 1L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);

        ReviewResponse response = reviewService.createReview(4L, request);

        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("Great motorcycle and honest seller!", response.getComment());
        verify(notificationService, times(1)).sendNotification(eq(2L), eq("NEW_REVIEW"), anyString());
    }

    @Test
    void createReview_WhenSelfReview_ThrowsBadRequestException() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .sellerId(2L)
                .rating(5)
                .comment("Self praise")
                .build();

        assertThrows(BadRequestException.class, () -> reviewService.createReview(2L, request));
    }

    @Test
    void createReview_WhenDuplicateReviewForSameBike_ThrowsBadRequestException() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .sellerId(2L)
                .bikeId(1L)
                .rating(4)
                .comment("Second review")
                .build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleBuyer));
        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleSeller));
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));
        when(reviewRepository.existsByReviewerIdAndSellerIdAndBikeId(4L, 2L, 1L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> reviewService.createReview(4L, request));
    }

    @Test
    void sendNotification_WhenValid_SavesAndBroadcastsToStompTopic() {
        Notification savedNotif = Notification.builder()
                .id(77L)
                .user(sampleSeller)
                .type("ALERT")
                .message("Test notification message")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleSeller));
        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotif);

        NotificationResponse response = realNotificationService.sendNotification(2L, "ALERT", "Test notification message");

        assertNotNull(response);
        assertEquals(77L, response.getId());
        assertEquals("ALERT", response.getType());
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/notifications/2"), any(NotificationResponse.class));
    }
}
