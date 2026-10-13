package com.bikehub.service;

import com.bikehub.dto.request.CreatePaymentOrderRequest;
import com.bikehub.dto.request.PaymentVerificationRequest;
import com.bikehub.dto.response.PaymentOrderResponse;
import com.bikehub.dto.response.PaymentResponse;

public interface PaymentService {

    PaymentOrderResponse createPaymentOrder(Long buyerId, CreatePaymentOrderRequest request);

    PaymentResponse verifyPayment(Long buyerId, PaymentVerificationRequest request);

    PaymentResponse getPaymentByOrderId(Long requesterId, boolean isAdmin, Long orderId);
}
