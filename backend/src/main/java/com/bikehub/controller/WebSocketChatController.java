package com.bikehub.controller;

import com.bikehub.dto.request.ChatMessageRequest;
import com.bikehub.dto.response.ChatMessageResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void handleIncomingChatMessage(
            @Payload ChatMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails != null) {
            log.info("Received WebSocket chat message from user {} for room {}", userDetails.getId(), request.getRoomId());
            chatService.sendMessage(userDetails.getId(), request);
        } else {
            log.warn("Unauthenticated WebSocket message rejected");
        }
    }
}
