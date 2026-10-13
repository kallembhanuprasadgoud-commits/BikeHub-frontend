package com.bikehub.service.impl;

import com.bikehub.dto.request.CreateOrderRequest;
import com.bikehub.dto.response.*;
import com.bikehub.entity.Bike;
import com.bikehub.entity.Order;
import com.bikehub.entity.Payment;
import com.bikehub.entity.User;
import com.bikehub.enums.BikeStatus;
import com.bikehub.enums.OrderStatus;
import com.bikehub.enums.PaymentStatus;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.OrderRepository;
import com.bikehub.repository.PaymentRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.service.BikeService;
import com.bikehub.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final BikeRepository bikeRepository;
    private final UserRepository userRepository;
    private final BikeService bikeService;

    @Override
    @Transactional
    public OrderResponse createOrder(Long buyerId, CreateOrderRequest request) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer account not found with id: " + buyerId));

        Bike bike = bikeRepository.findById(request.getBikeId())
                .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + request.getBikeId()));

        if (bike.getStatus() != BikeStatus.AVAILABLE) {
            throw new BadRequestException("This motorcycle is currently not available for purchase (Status: " + bike.getStatus() + ")");
        }

        if (bike.getSeller().getId().equals(buyerId)) {
            throw new BadRequestException("Sellers cannot purchase their own motorcycle listing");
        }

        // 1. If this same buyer already has an open PLACED (unpaid) order for this bike, resume it
        Optional<Order> existingBuyerOrder = orderRepository.findFirstByBikeIdAndBuyerIdAndStatus(
                bike.getId(), buyerId, OrderStatus.PLACED
        );
        if (existingBuyerOrder.isPresent()) {
            Order existingOrder = existingBuyerOrder.get();
            if (existingOrder.getPayment() == null) {
                Payment payment = paymentRepository.findByOrderId(existingOrder.getId())
                        .orElseGet(() -> paymentRepository.save(Payment.builder()
                                .order(existingOrder)
                                .status(PaymentStatus.CREATED)
                                .method("ONLINE")
                                .build()));
                existingOrder.setPayment(payment);
            }
            log.info("Buyer {} is resuming existing PLACED order {} for bike {}", buyerId, existingOrder.getId(), bike.getId());
            return mapToOrderResponse(existingOrder);
        }

        // 2. Check for active orders by others (PAID, SHIPPED, or recent PLACED)
        List<Order> activeOrders = orderRepository.findByBikeIdAndStatusIn(
                bike.getId(),
                Arrays.asList(OrderStatus.PLACED, OrderStatus.PAID, OrderStatus.SHIPPED)
        );
        for (Order otherOrder : activeOrders) {
            if (otherOrder.getBuyer().getId().equals(buyerId)) {
                continue; // Do not block buyer on their own orders
            }
            if (otherOrder.getStatus() == OrderStatus.PAID || otherOrder.getStatus() == OrderStatus.SHIPPED) {
                throw new BadRequestException("An order is already in progress for this motorcycle");
            }
            if (otherOrder.getStatus() == OrderStatus.PLACED) {
                if (otherOrder.getCreatedAt() != null && otherOrder.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(15))) {
                    throw new BadRequestException("Another buyer is currently completing checkout for this motorcycle. Please try again shortly.");
                } else {
                    otherOrder.setStatus(OrderStatus.CANCELLED);
                    orderRepository.save(otherOrder);
                    log.info("Auto-cancelled stale unpaid PLACED order {} for bike {}", otherOrder.getId(), bike.getId());
                }
            }
        }

        Order order = Order.builder()
                .buyer(buyer)
                .bike(bike)
                .amount(bike.getPrice())
                .status(OrderStatus.PLACED)
                .build();

        Order savedOrder = orderRepository.save(order);

        // Pre-create initial Payment tracking record
        Payment payment = Payment.builder()
                .order(savedOrder)
                .status(PaymentStatus.CREATED)
                .method("ONLINE")
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        savedOrder.setPayment(savedPayment);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long requesterId, boolean isAdmin, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getBuyer().getId().equals(requesterId) && !order.getBike().getSeller().getId().equals(requesterId)) {
            throw new UnauthorizedException("You do not have permission to view this order");
        }

        return mapToOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getBuyerOrders(Long buyerId, Pageable pageable) {
        Page<Order> page = orderRepository.findByBuyerId(buyerId, pageable);
        List<OrderResponse> list = page.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
                .content(list)
                .pageNo(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getSellerOrders(Long sellerId, Pageable pageable) {
        Page<Order> page = orderRepository.findByBikeSellerId(sellerId, pageable);
        List<OrderResponse> list = page.getContent().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return PageResponse.<OrderResponse>builder()
                .content(list)
                .pageNo(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long requesterId, boolean isAdmin, Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        Long sellerId = order.getBike().getSeller().getId();
        Long buyerId = order.getBuyer().getId();

        if (!isAdmin && !requesterId.equals(sellerId) && !requesterId.equals(buyerId)) {
            throw new UnauthorizedException("You do not have permission to modify this order");
        }

        // Validate state transitions
        if (newStatus == OrderStatus.CANCELLED) {
            cancelOrder(requesterId, isAdmin, orderId);
            return getOrderById(requesterId, isAdmin, orderId);
        }

        // Only seller/admin can mark SHIPPED or DELIVERED
        if (newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.DELIVERED) {
            if (!isAdmin && !requesterId.equals(sellerId)) {
                throw new UnauthorizedException("Only the seller or admin can mark orders as SHIPPED or DELIVERED");
            }
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        return mapToOrderResponse(updated);
    }

    @Override
    @Transactional
    public void cancelOrder(Long requesterId, boolean isAdmin, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getBuyer().getId().equals(requesterId) && !order.getBike().getSeller().getId().equals(requesterId)) {
            throw new UnauthorizedException("You do not have permission to cancel this order");
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Delivered orders cannot be cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);

        // Revert bike status to AVAILABLE if it was reserved
        Bike bike = order.getBike();
        if (bike.getStatus() == BikeStatus.SOLD) {
            bike.setStatus(BikeStatus.AVAILABLE);
            bikeRepository.save(bike);
        }

        orderRepository.save(order);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        User buyer = order.getBuyer();
        UserSummaryResponse buyerSummary = UserSummaryResponse.builder()
                .id(buyer.getId())
                .name(buyer.getName())
                .email(buyer.getEmail())
                .phone(buyer.getPhone())
                .build();

        BikeResponse bikeResponse = bikeService.getBikeById(order.getBike().getId(), null);

        PaymentResponse paymentResponse = null;
        if (order.getPayment() != null) {
            Payment p = order.getPayment();
            paymentResponse = PaymentResponse.builder()
                    .id(p.getId())
                    .orderId(order.getId())
                    .gatewayPaymentId(p.getGatewayPaymentId())
                    .status(p.getStatus())
                    .method(p.getMethod())
                    .paidAt(p.getPaidAt())
                    .build();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .amount(order.getAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .buyer(buyerSummary)
                .bike(bikeResponse)
                .payment(paymentResponse)
                .build();
    }
}
