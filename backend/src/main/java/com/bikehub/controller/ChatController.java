package com.bikehub.controller;

import com.bikehub.dto.request.ChatMessageRequest;
import com.bikehub.dto.request.CreateChatRoomRequest;
import com.bikehub.dto.response.ApiResponse;
import com.bikehub.dto.response.ChatMessageResponse;
import com.bikehub.dto.response.ChatRoomResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Endpoints for buyer-seller real-time communications and room histories")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/rooms")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get or create chat room", description = "Initiates or resumes a private chat room between buyer and bike seller")
    public ResponseEntity<ChatRoomResponse> getOrCreateRoom(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateChatRoomRequest request
    ) {
        ChatRoomResponse response = chatService.getOrCreateRoom(userDetails.getId(), request.getBikeId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/rooms")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user chat rooms", description = "Lists all conversation threads for the authenticated user")
    public ResponseEntity<List<ChatRoomResponse>> getUserRooms(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<ChatRoomResponse> response = chatService.getUserRooms(userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rooms/{roomId}/messages")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get chat history for room", description = "Fetches ordered conversation messages within a chat room")
    public ResponseEntity<List<ChatMessageResponse>> getRoomMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<ChatMessageResponse> response = chatService.getRoomMessages(userDetails.getId(), roomId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/messages")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Send message via REST", description = "Sends message into a room and triggers WebSocket & notification broadcasts")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChatMessageRequest request
    ) {
        ChatMessageResponse response = chatService.sendMessage(userDetails.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/rooms/{roomId}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark messages as read", description = "Updates message read receipts within a room")
    public ResponseEntity<ApiResponse> markRoomAsRead(
            @PathVariable Long roomId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        chatService.markRoomAsRead(userDetails.getId(), roomId);
        return ResponseEntity.ok(new ApiResponse(true, "Messages marked as read"));
    }
}
