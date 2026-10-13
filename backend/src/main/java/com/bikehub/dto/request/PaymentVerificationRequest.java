package com.bikehub.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentVerificationRequest {

    @NotNull(message = "Order ID is required")
    private Long orderId;

    @JsonAlias({"razorpayPaymentId", "razorpay_payment_id"})
    private String gatewayPaymentId;

    @JsonAlias({"razorpayOrderId", "razorpay_order_id"})
    private String gatewayOrderId;

    @JsonAlias({"razorpaySignature", "razorpay_signature"})
    private String gatewaySignature;

    @Builder.Default
    private String method = "UPI";

    public String getGatewayPaymentId() {
        if (gatewayPaymentId != null && !gatewayPaymentId.isBlank()) {
            return gatewayPaymentId;
        }
        return "pay_sim_" + System.currentTimeMillis();
    }
}
