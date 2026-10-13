package com.bikehub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOrderResponse {

    private String gatewayOrderId;
    private Long orderId;
    private BigDecimal amount;
    private long amountInPaise;
    private String currency;
    private String keyId;
    private String notes;

    public String getRazorpayOrderId() {
        return gatewayOrderId;
    }
}
