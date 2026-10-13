package com.bikehub.service;

import com.bikehub.dto.request.CreateOrderRequest;
import com.bikehub.dto.request.CreatePaymentOrderRequest;
import com.bikehub.dto.request.PaymentVerificationRequest;
import com.bikehub.dto.response.BikeResponse;
import com.bikehub.dto.response.OrderResponse;
import com.bikehub.dto.response.PaymentOrderResponse;
import com.bikehub.dto.response.PaymentResponse;
import com.bikehub.entity.Bike;
import com.bikehub.entity.Order;
import com.bikehub.entity.Payment;
import com.bikehub.entity.User;
import com.bikehub.enums.BikeStatus;
import com.bikehub.enums.OrderStatus;
import com.bikehub.enums.PaymentStatus;
import com.bikehub.enums.Role;
import com.bikehub.enums.UserStatus;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.OrderRepository;
import com.bikehub.repository.PaymentRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.service.impl.OrderServiceImpl;
import com.bikehub.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BikeRepository bikeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BikeService bikeService;

    @InjectMocks
    private OrderServiceImpl orderService;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private User sampleBuyer;
    private User sampleSeller;
    private Bike sampleBike;
    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "paymentKeyId", "rzp_test_bikehub_mock");
        ReflectionTestUtils.setField(paymentService, "paymentKeySecret", "testSecretKey");

        sampleBuyer = User.builder()
                .id(4L)
                .name("Buyer Amit")
                .email("buyer.amit@gmail.com")
                .role(Role.BUYER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleSeller = User.builder()
                .id(2L)
                .name("Seller Rajesh")
                .email("seller.rajesh@bikehub.com")
                .role(Role.SELLER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleBike = Bike.builder()
                .id(1L)
                .seller(sampleSeller)
                .brand("Royal Enfield")
                .model("Classic 350")
                .price(new BigDecimal("165000.00"))
                .status(BikeStatus.AVAILABLE)
                .build();

        sampleOrder = Order.builder()
                .id(10L)
                .buyer(sampleBuyer)
                .bike(sampleBike)
                .amount(new BigDecimal("165000.00"))
                .status(OrderStatus.PLACED)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createOrder_WhenValid_ReturnsOrderResponse() {
        CreateOrderRequest request = CreateOrderRequest.builder().bikeId(1L).build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleBuyer));
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));
        when(orderRepository.findFirstByBikeIdAndBuyerIdAndStatus(eq(1L), eq(4L), eq(OrderStatus.PLACED))).thenReturn(Optional.empty());
        when(orderRepository.findByBikeIdAndStatusIn(eq(1L), any())).thenReturn(java.util.Collections.emptyList());
        when(orderRepository.save(any(Order.class))).thenReturn(sampleOrder);
        when(paymentRepository.save(any(Payment.class))).thenReturn(Payment.builder().id(100L).status(PaymentStatus.CREATED).build());
        when(bikeService.getBikeById(1L, null)).thenReturn(BikeResponse.builder().id(1L).brand("Royal Enfield").build());

        OrderResponse response = orderService.createOrder(4L, request);

        assertNotNull(response);
        assertEquals(OrderStatus.PLACED, response.getStatus());
        assertEquals(new BigDecimal("165000.00"), response.getAmount());
    }

    @Test
    void createOrder_WhenSameBuyerHasPlacedOrder_ResumesOrder() {
        CreateOrderRequest request = CreateOrderRequest.builder().bikeId(1L).build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleBuyer));
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));
        when(orderRepository.findFirstByBikeIdAndBuyerIdAndStatus(eq(1L), eq(4L), eq(OrderStatus.PLACED))).thenReturn(Optional.of(sampleOrder));
        when(bikeService.getBikeById(1L, null)).thenReturn(BikeResponse.builder().id(1L).brand("Royal Enfield").build());

        OrderResponse response = orderService.createOrder(4L, request);

        assertNotNull(response);
        assertEquals(OrderStatus.PLACED, response.getStatus());
        assertEquals(new BigDecimal("165000.00"), response.getAmount());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void createOrder_WhenBikeSold_ThrowsBadRequestException() {
        sampleBike.setStatus(BikeStatus.SOLD);
        CreateOrderRequest request = CreateOrderRequest.builder().bikeId(1L).build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleBuyer));
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));

        assertThrows(BadRequestException.class, () -> orderService.createOrder(4L, request));
    }

    @Test
    void createOrder_WhenSellerTriesToBuyOwnBike_ThrowsBadRequestException() {
        CreateOrderRequest request = CreateOrderRequest.builder().bikeId(1L).build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleSeller));
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));

        assertThrows(BadRequestException.class, () -> orderService.createOrder(2L, request));
    }

    @Test
    void updateOrderStatus_WhenSellerMarksShipped_Success() {
        sampleOrder.setStatus(OrderStatus.PAID);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(sampleOrder));
        when(orderRepository.save(any(Order.class))).thenReturn(sampleOrder);
        when(bikeService.getBikeById(1L, null)).thenReturn(BikeResponse.builder().id(1L).build());

        OrderResponse response = orderService.updateOrderStatus(2L, false, 10L, OrderStatus.SHIPPED);

        assertNotNull(response);
        assertEquals(OrderStatus.SHIPPED, sampleOrder.getStatus());
    }

    @Test
    void createPaymentOrder_WhenValid_ReturnsPaymentOrderResponse() {
        CreatePaymentOrderRequest request = CreatePaymentOrderRequest.builder().orderId(10L).build();
        when(orderRepository.findById(10L)).thenReturn(Optional.of(sampleOrder));

        PaymentOrderResponse response = paymentService.createPaymentOrder(4L, request);

        assertNotNull(response);
        assertEquals(10L, response.getOrderId());
        assertEquals(16500000L, response.getAmountInPaise());
        assertTrue(response.getGatewayOrderId().startsWith("order_rzp_"));
    }

    @Test
    void verifyPayment_WhenValid_UpdatesPaymentAndOrderAndMarksBikeSold() {
        PaymentVerificationRequest request = PaymentVerificationRequest.builder()
                .orderId(10L)
                .gatewayPaymentId("pay_test_998877")
                .gatewayOrderId("order_rzp_mock_123")
                .method("UPI")
                .build();

        Payment initialPayment = Payment.builder().id(50L).order(sampleOrder).status(PaymentStatus.CREATED).build();

        when(orderRepository.findById(10L)).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(initialPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.verifyPayment(4L, request);

        assertNotNull(response);
        assertEquals(PaymentStatus.SUCCESS, response.getStatus());
        assertEquals("pay_test_998877", response.getGatewayPaymentId());
        assertEquals(OrderStatus.PAID, sampleOrder.getStatus());
        assertEquals(BikeStatus.SOLD, sampleBike.getStatus());
        verify(bikeRepository, times(1)).save(sampleBike);
    }
}
