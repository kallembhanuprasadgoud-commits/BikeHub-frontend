package com.bikehub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomResponse {

    private Long id;
    private BikeSummaryResponse bike;
    private UserSummaryResponse buyer;
    private SellerSummaryResponse seller;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private long unreadCount;
}
