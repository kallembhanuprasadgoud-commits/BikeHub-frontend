package com.bikehub.service;

import com.bikehub.dto.request.ChatMessageRequest;
import com.bikehub.dto.response.ChatMessageResponse;
import com.bikehub.dto.response.ChatRoomResponse;

import java.util.List;

public interface ChatService {

    ChatRoomResponse getOrCreateRoom(Long buyerId, Long bikeId);

    List<ChatRoomResponse> getUserRooms(Long userId);

    List<ChatMessageResponse> getRoomMessages(Long requesterId, Long roomId);

    ChatMessageResponse sendMessage(Long senderId, ChatMessageRequest request);

    void markRoomAsRead(Long readerId, Long roomId);
}
