package com.bikehub.controller;

import com.bikehub.dto.request.CreateOrderRequest;
import com.bikehub.dto.request.OrderStatusUpdateRequest;
import com.bikehub.dto.response.ApiResponse;
import com.bikehub.dto.response.OrderResponse;
import com.bikehub.dto.response.PageResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Endpoints for placing, tracking, and fulfilling motorcycle orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Place a new order", description = "Creates a PLACED order for an available motorcycle listing")
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        OrderResponse response = orderService.createOrder(userDetails.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get order by ID", description = "Returns order details, bike specifications, and payment status")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        OrderResponse response = orderService.getOrderById(userDetails.getId(), isAdmin, id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-orders")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get buyer orders", description = "Returns paginated orders placed by the authenticated buyer")
    public ResponseEntity<PageResponse<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<OrderResponse> response = orderService.getBuyerOrders(userDetails.getId(), pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/seller-orders")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Get seller incoming orders", description = "Returns paginated orders received by the authenticated seller")
    public ResponseEntity<PageResponse<OrderResponse>> getSellerOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<OrderResponse> response = orderService.getSellerOrders(userDetails.getId(), pageable);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    @Operation(summary = "Update order status", description = "Advances order state (SHIPPED, DELIVERED, CANCELLED)")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        OrderResponse response = orderService.updateOrderStatus(userDetails.getId(), isAdmin, id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel order", description = "Cancels an order and unreserves the motorcycle if applicable")
    public ResponseEntity<ApiResponse> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        orderService.cancelOrder(userDetails.getId(), isAdmin, id);
        return ResponseEntity.ok(new ApiResponse(true, "Order has been cancelled successfully"));
    }
}
