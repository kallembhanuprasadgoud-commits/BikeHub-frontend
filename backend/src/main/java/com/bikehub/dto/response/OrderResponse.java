package com.bikehub.dto.response;

import com.bikehub.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private BigDecimal amount;
    private OrderStatus status;
    private LocalDateTime createdAt;

    private UserSummaryResponse buyer;
    private BikeResponse bike;
    private PaymentResponse payment;
}
