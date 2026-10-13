package com.bikehub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // SockJS fallback for browsers without pure WebSocket support
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Raw WebSocket endpoint for direct STOMP clients
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Prefix for server-to-client subscriptions (/topic/chat/{roomId}, /topic/notifications/{userId})
        registry.enableSimpleBroker("/topic", "/queue");

        // Prefix for client-to-server messages (/app/chat.send)
        registry.setApplicationDestinationPrefixes("/app");

        // Prefix for user-targeted messages
        registry.setUserDestinationPrefix("/user");
    }
}
