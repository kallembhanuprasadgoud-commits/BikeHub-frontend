package com.bikehub.service;

import com.bikehub.dto.request.SellerVerificationDecisionRequest;
import com.bikehub.dto.request.SellerVerificationRequest;
import com.bikehub.dto.response.AdminAnalyticsResponse;
import com.bikehub.dto.response.SellerProfileResponse;
import com.bikehub.dto.response.UserResponse;
import com.bikehub.entity.SellerProfile;
import com.bikehub.entity.User;
import com.bikehub.enums.Role;
import com.bikehub.enums.UserStatus;
import com.bikehub.enums.VerificationStatus;
import com.bikehub.exception.BadRequestException;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.OrderRepository;
import com.bikehub.repository.SellerProfileRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private BikeRepository bikeRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private BikeService bikeService;

    @InjectMocks
    private AdminServiceImpl adminService;

    private User sampleSellerUser;
    private User sampleAdminUser;
    private SellerProfile sampleSellerProfile;

    @BeforeEach
    void setUp() {
        sampleSellerUser = User.builder()
                .id(2L)
                .name("Rajesh Sharma")
                .email("seller@test.com")
                .role(Role.SELLER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleAdminUser = User.builder()
                .id(1L)
                .name("Admin User")
                .email("admin@bikehub.com")
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();

        sampleSellerProfile = SellerProfile.builder()
                .id(10L)
                .user(sampleSellerUser)
                .shopName("Rajesh Superbikes")
                .address("FC Road")
                .city("Pune")
                .verificationStatus(VerificationStatus.PENDING)
                .documentUrl("https://example.com/gst.pdf")
                .build();
    }

    @Test
    void submitSellerVerification_WhenValid_ReturnsSellerProfile() {
        SellerVerificationRequest request = SellerVerificationRequest.builder()
                .shopName("Rajesh Superbikes")
                .address("FC Road")
                .city("Pune")
                .documentUrl("https://example.com/gst.pdf")
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleSellerUser));
        when(sellerProfileRepository.save(any(SellerProfile.class))).thenReturn(sampleSellerProfile);

        SellerProfileResponse response = adminService.submitSellerVerification(2L, request);

        assertNotNull(response);
        assertEquals("Rajesh Superbikes", response.getShopName());
        assertEquals(VerificationStatus.PENDING, response.getVerificationStatus());
        verify(sellerProfileRepository, times(1)).save(any(SellerProfile.class));
    }

    @Test
    void decideSellerVerification_WhenApproved_SetsVerifiedAndNotifies() {
        SellerVerificationDecisionRequest request = SellerVerificationDecisionRequest.builder()
                .status(VerificationStatus.VERIFIED)
                .build();

        when(sellerProfileRepository.findById(10L)).thenReturn(Optional.of(sampleSellerProfile));
        when(sellerProfileRepository.save(any(SellerProfile.class))).thenReturn(sampleSellerProfile);

        SellerProfileResponse response = adminService.decideSellerVerification(10L, request);

        assertNotNull(response);
        assertEquals(VerificationStatus.VERIFIED, sampleSellerProfile.getVerificationStatus());
        assertNotNull(sampleSellerProfile.getVerifiedAt());
        verify(notificationService, times(1)).sendNotification(eq(2L), eq("VERIFICATION_APPROVED"), anyString());
    }

    @Test
    void decideSellerVerification_WhenRejected_SetsRejectedAndNotifies() {
        SellerVerificationDecisionRequest request = SellerVerificationDecisionRequest.builder()
                .status(VerificationStatus.REJECTED)
                .adminRemarks("Document expired")
                .build();

        when(sellerProfileRepository.findById(10L)).thenReturn(Optional.of(sampleSellerProfile));
        when(sellerProfileRepository.save(any(SellerProfile.class))).thenReturn(sampleSellerProfile);

        SellerProfileResponse response = adminService.decideSellerVerification(10L, request);

        assertNotNull(response);
        assertEquals(VerificationStatus.REJECTED, sampleSellerProfile.getVerificationStatus());
        verify(notificationService, times(1)).sendNotification(eq(2L), eq("VERIFICATION_REJECTED"), contains("Document expired"));
    }

    @Test
    void updateUserStatus_WhenUserIsBuyer_Success() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleSellerUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleSellerUser);

        UserResponse response = adminService.updateUserStatus(2L, UserStatus.BLOCKED);

        assertNotNull(response);
        assertEquals(UserStatus.BLOCKED, sampleSellerUser.getStatus());
    }

    @Test
    void updateUserStatus_WhenUserIsAdmin_ThrowsBadRequestException() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleAdminUser));

        assertThrows(BadRequestException.class, () -> adminService.updateUserStatus(1L, UserStatus.BLOCKED));
        verify(userRepository, never()).save(any());
    }

    @Test
    void getPlatformAnalytics_AggregatesMetricsCorrectly() {
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByRole(Role.BUYER)).thenReturn(7L);
        when(userRepository.countByRole(Role.SELLER)).thenReturn(2L);
        when(sellerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING)).thenReturn(1L);
        when(bikeRepository.count()).thenReturn(15L);
        when(bikeRepository.countByStatus(any())).thenReturn(10L);
        when(orderRepository.count()).thenReturn(5L);
        when(orderRepository.sumTotalRevenue()).thenReturn(new BigDecimal("750000.00"));
        when(bikeRepository.findTopBrandsWithStats()).thenReturn(new ArrayList<>());
        when(bikeRepository.findTopCities()).thenReturn(new ArrayList<>());
        when(orderRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(new ArrayList<>());

        AdminAnalyticsResponse response = adminService.getPlatformAnalytics();

        assertNotNull(response);
        assertEquals(10L, response.getTotalUsers());
        assertEquals(7L, response.getTotalBuyers());
        assertEquals(2L, response.getTotalSellers());
        assertEquals(15L, response.getTotalBikes());
        assertEquals(5L, response.getTotalOrders());
        assertEquals(new BigDecimal("750000.00"), response.getTotalRevenue());
    }
}
