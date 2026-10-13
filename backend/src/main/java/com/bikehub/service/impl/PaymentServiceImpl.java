package com.bikehub.service.impl;

import com.bikehub.dto.request.CreatePaymentOrderRequest;
import com.bikehub.dto.request.PaymentVerificationRequest;
import com.bikehub.dto.response.PaymentOrderResponse;
import com.bikehub.dto.response.PaymentResponse;
import com.bikehub.entity.Bike;
import com.bikehub.entity.Order;
import com.bikehub.entity.Payment;
import com.bikehub.enums.BikeStatus;
import com.bikehub.enums.OrderStatus;
import com.bikehub.enums.PaymentStatus;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.OrderRepository;
import com.bikehub.repository.PaymentRepository;
import com.bikehub.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final BikeRepository bikeRepository;

    @Value("${payment.key-id:rzp_test_bikehub_mock}")
    private String paymentKeyId;

    @Value("${payment.key-secret:CHANGE_ME}")
    private String paymentKeySecret;

    @Override
    @Transactional
    public PaymentOrderResponse createPaymentOrder(Long buyerId, CreatePaymentOrderRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new UnauthorizedException("You do not have permission to pay for this order");
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new BadRequestException("Order is not in PLACED state (Current status: " + order.getStatus() + ")");
        }

        long amountInPaise = order.getAmount().multiply(new BigDecimal("100")).longValue();
        String gatewayOrderId = "order_rzp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);

        log.info("Generated payment order {} for internal order {} (Amount: {} paise)",
                gatewayOrderId, order.getId(), amountInPaise);

        return PaymentOrderResponse.builder()
                .gatewayOrderId(gatewayOrderId)
                .orderId(order.getId())
                .amount(order.getAmount())
                .amountInPaise(amountInPaise)
                .currency("INR")
                .keyId(paymentKeyId.equals("CHANGE_ME") ? "rzp_test_bikehub_demo" : paymentKeyId)
                .notes("Payment for motorcycle: " + order.getBike().getBrand() + " " + order.getBike().getModel())
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse verifyPayment(Long buyerId, PaymentVerificationRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + request.getOrderId()));

        if (!order.getBuyer().getId().equals(buyerId)) {
            throw new UnauthorizedException("You do not have permission to verify payment for this order");
        }

        if (order.getStatus() == OrderStatus.PAID) {
            log.info("Order {} is already marked as PAID", order.getId());
        }

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder().order(order).build());

        payment.setGatewayPaymentId(request.getGatewayPaymentId());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setMethod(request.getMethod() != null ? request.getMethod() : "ONLINE");
        payment.setPaidAt(LocalDateTime.now());
        Payment savedPayment = paymentRepository.save(payment);

        // Update Order status
        order.setStatus(OrderStatus.PAID);
        order.setPayment(savedPayment);
        orderRepository.save(order);

        // Reserve bike and mark as SOLD
        Bike bike = order.getBike();
        bike.setStatus(BikeStatus.SOLD);
        bikeRepository.save(bike);

        log.info("Payment SUCCESS for order {}. Bike {} marked as SOLD.", order.getId(), bike.getId());

        return PaymentResponse.builder()
                .id(savedPayment.getId())
                .orderId(order.getId())
                .gatewayPaymentId(savedPayment.getGatewayPaymentId())
                .status(savedPayment.getStatus())
                .method(savedPayment.getMethod())
                .paidAt(savedPayment.getPaidAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByOrderId(Long requesterId, boolean isAdmin, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getBuyer().getId().equals(requesterId) && !order.getBike().getSeller().getId().equals(requesterId)) {
            throw new UnauthorizedException("You do not have permission to view payment details for this order");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found for order id: " + orderId));

        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(order.getId())
                .gatewayPaymentId(payment.getGatewayPaymentId())
                .status(payment.getStatus())
                .method(payment.getMethod())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
