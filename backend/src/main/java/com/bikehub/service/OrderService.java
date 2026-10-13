package com.bikehub.service;

import com.bikehub.dto.request.CreateOrderRequest;
import com.bikehub.dto.response.OrderResponse;
import com.bikehub.dto.response.PageResponse;
import com.bikehub.enums.OrderStatus;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    OrderResponse createOrder(Long buyerId, CreateOrderRequest request);

    OrderResponse getOrderById(Long requesterId, boolean isAdmin, Long orderId);

    PageResponse<OrderResponse> getBuyerOrders(Long buyerId, Pageable pageable);

    PageResponse<OrderResponse> getSellerOrders(Long sellerId, Pageable pageable);

    OrderResponse updateOrderStatus(Long requesterId, boolean isAdmin, Long orderId, OrderStatus status);

    void cancelOrder(Long requesterId, boolean isAdmin, Long orderId);
}
