package com.bikehub.dto.response;

import com.bikehub.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long id;
    private Long orderId;
    private String gatewayPaymentId;
    private PaymentStatus status;
    private String method;
    private LocalDateTime paidAt;
}
