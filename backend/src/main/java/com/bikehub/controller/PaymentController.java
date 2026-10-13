package com.bikehub.controller;

import com.bikehub.dto.request.CreatePaymentOrderRequest;
import com.bikehub.dto.request.PaymentVerificationRequest;
import com.bikehub.dto.response.PaymentOrderResponse;
import com.bikehub.dto.response.PaymentResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Endpoints for initiating and verifying secure motorcycle transactions")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping({"/create-order", "/create-order/{orderId}"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create payment gateway order", description = "Initiates transaction and returns Razorpay test-mode order credentials")
    public ResponseEntity<PaymentOrderResponse> createPaymentOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable(required = false) Long orderId,
            @RequestBody(required = false) CreatePaymentOrderRequest request
    ) {
        Long targetOrderId = (orderId != null) ? orderId : (request != null ? request.getOrderId() : null);
        if (targetOrderId == null) {
            throw new com.bikehub.exception.BadRequestException("Order ID is required to initiate payment");
        }
        PaymentOrderResponse response = paymentService.createPaymentOrder(userDetails.getId(), new CreatePaymentOrderRequest(targetOrderId));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Verify payment signature", description = "Confirms transaction signature, updates order to PAID, and marks bike as SOLD")
    public ResponseEntity<PaymentResponse> verifyPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PaymentVerificationRequest request
    ) {
        PaymentResponse response = paymentService.verifyPayment(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get payment details by order ID", description = "Returns payment transaction record for the specified order")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(
            @PathVariable Long orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        PaymentResponse response = paymentService.getPaymentByOrderId(userDetails.getId(), isAdmin, orderId);
        return ResponseEntity.ok(response);
    }
}
