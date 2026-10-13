package com.bikehub.service.impl;

import com.bikehub.dto.request.SellerVerificationDecisionRequest;
import com.bikehub.dto.request.SellerVerificationRequest;
import com.bikehub.dto.response.*;
import com.bikehub.entity.Bike;
import com.bikehub.entity.Order;
import com.bikehub.entity.SellerProfile;
import com.bikehub.entity.User;
import com.bikehub.enums.*;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.OrderRepository;
import com.bikehub.repository.SellerProfileRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.service.AdminService;
import com.bikehub.service.BikeService;
import com.bikehub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final BikeRepository bikeRepository;
    private final com.bikehub.repository.BikeImageRepository bikeImageRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final BikeService bikeService;

    @Override
    @Transactional
    public SellerProfileResponse submitSellerVerification(Long sellerId, SellerVerificationRequest request) {
        User user = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + sellerId));

        SellerProfile profile = user.getSellerProfile();
        if (profile == null) {
            profile = SellerProfile.builder()
                    .user(user)
                    .build();
        }

        profile.setShopName(request.getShopName().trim());
        profile.setAddress(request.getAddress().trim());
        profile.setCity(request.getCity().trim());
        profile.setDocumentUrl(request.getDocumentUrl().trim());
        profile.setVerificationStatus(VerificationStatus.PENDING);

        SellerProfile saved = sellerProfileRepository.save(profile);
        user.setSellerProfile(saved);
        user.setRole(Role.SELLER);
        userRepository.save(user);

        log.info("Seller verification documents submitted for user {}: {}", sellerId, request.getShopName());
        return mapToSellerResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerProfileResponse getSellerVerificationStatus(Long sellerId) {
        SellerProfile profile = sellerProfileRepository.findByUserId(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("No seller profile found for user id: " + sellerId));
        return mapToSellerResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SellerProfileResponse> getPendingSellerVerifications(Pageable pageable) {
        Page<SellerProfile> page = sellerProfileRepository.findByVerificationStatus(VerificationStatus.PENDING, pageable);
        List<SellerProfileResponse> list = page.getContent().stream()
                .map(this::mapToSellerResponse)
                .collect(Collectors.toList());

        return PageResponse.<SellerProfileResponse>builder()
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
    public SellerProfileResponse decideSellerVerification(Long sellerProfileId, SellerVerificationDecisionRequest request) {
        SellerProfile profile = sellerProfileRepository.findById(sellerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller profile not found with id: " + sellerProfileId));

        profile.setVerificationStatus(request.getStatus());
        if (request.getStatus() == VerificationStatus.VERIFIED) {
            profile.setVerifiedAt(LocalDateTime.now());
            notificationService.sendNotification(
                    profile.getUser().getId(),
                    "VERIFICATION_APPROVED",
                    "Congratulations! Your BikeHub seller dealership has been officially VERIFIED."
            );
        } else if (request.getStatus() == VerificationStatus.REJECTED) {
            notificationService.sendNotification(
                    profile.getUser().getId(),
                    "VERIFICATION_REJECTED",
                    "Your dealership verification application was rejected. " + (request.getAdminRemarks() != null ? "Reason: " + request.getAdminRemarks() : "Please re-upload valid documents.")
            );
        }

        SellerProfile saved = sellerProfileRepository.save(profile);
        return mapToSellerResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(Role role, UserStatus status, Pageable pageable) {
        Page<User> page;
        if (role != null && status != null) {
            page = userRepository.findByRoleAndStatus(role, status, pageable);
        } else if (role != null) {
            page = userRepository.findByRole(role, pageable);
        } else if (status != null) {
            page = userRepository.findByStatus(status, pageable);
        } else {
            page = userRepository.findAll(pageable);
        }

        List<UserResponse> list = page.getContent().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
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
    public UserResponse updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Administrator accounts cannot be blocked");
        }

        user.setStatus(status);
        User updated = userRepository.save(user);

        log.info("User {} status updated to {}", userId, status);
        return mapToUserResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getPlatformAnalytics() {
        long totalUsers = userRepository.count();
        long totalBuyers = userRepository.countByRole(Role.BUYER);
        long totalSellers = userRepository.countByRole(Role.SELLER);
        long pendingVerifications = sellerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING);

        long totalBikes = bikeRepository.count();
        long availableBikes = bikeRepository.countByStatus(BikeStatus.AVAILABLE);
        long soldBikes = bikeRepository.countByStatus(BikeStatus.SOLD);

        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();

        // Top brands aggregation
        List<BrandMetric> brandMetrics = new ArrayList<>();
        List<Object[]> rawBrands = bikeRepository.findTopBrandsWithStats();
        if (rawBrands != null) {
            for (Object[] row : rawBrands) {
                String brand = (String) row[0];
                long count = ((Number) row[1]).longValue();
                double avg = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
                brandMetrics.add(BrandMetric.builder()
                        .brand(brand)
                        .count(count)
                        .avgPrice(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP))
                        .build());
            }
        }

        // Top cities aggregation
        List<CityMetric> cityMetrics = new ArrayList<>();
        List<Object[]> rawCities = bikeRepository.findTopCities();
        if (rawCities != null) {
            for (Object[] row : rawCities) {
                String city = (String) row[0];
                long count = ((Number) row[1]).longValue();
                cityMetrics.add(CityMetric.builder()
                        .city(city)
                        .count(count)
                        .build());
            }
        }

        // Recent orders
        List<Order> recent = orderRepository.findTop5ByOrderByCreatedAtDesc();
        List<OrderResponse> recentResponses = recent.stream().map(order -> {
            User buyer = order.getBuyer();
            UserSummaryResponse buyerSummary = UserSummaryResponse.builder()
                    .id(buyer.getId())
                    .name(buyer.getName())
                    .email(buyer.getEmail())
                    .phone(buyer.getPhone())
                    .build();

            BikeResponse bikeResp = bikeService.getBikeById(order.getBike().getId(), null);

            PaymentResponse paymentResp = null;
            if (order.getPayment() != null) {
                paymentResp = PaymentResponse.builder()
                        .id(order.getPayment().getId())
                        .orderId(order.getId())
                        .gatewayPaymentId(order.getPayment().getGatewayPaymentId())
                        .status(order.getPayment().getStatus())
                        .method(order.getPayment().getMethod())
                        .paidAt(order.getPayment().getPaidAt())
                        .build();
            }

            return OrderResponse.builder()
                    .id(order.getId())
                    .amount(order.getAmount())
                    .status(order.getStatus())
                    .createdAt(order.getCreatedAt())
                    .buyer(buyerSummary)
                    .bike(bikeResp)
                    .payment(paymentResp)
                    .build();
        }).collect(Collectors.toList());

        return AdminAnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .totalBuyers(totalBuyers)
                .totalSellers(totalSellers)
                .pendingSellerVerifications(pendingVerifications)
                .totalBikes(totalBikes)
                .availableBikes(availableBikes)
                .soldBikes(soldBikes)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .topBrands(brandMetrics)
                .topCities(cityMetrics)
                .recentOrders(recentResponses)
                .build();
    }

    private SellerProfileResponse mapToSellerResponse(SellerProfile sp) {
        return SellerProfileResponse.builder()
                .id(sp.getId())
                .shopName(sp.getShopName())
                .address(sp.getAddress())
                .city(sp.getCity())
                .verificationStatus(sp.getVerificationStatus())
                .documentUrl(sp.getDocumentUrl())
                .verifiedAt(sp.getVerifiedAt())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        SellerProfileResponse sellerResp = null;
        if (user.getSellerProfile() != null) {
            sellerResp = mapToSellerResponse(user.getSellerProfile());
        }

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .sellerProfile(sellerResp)
                .build();
    }

    @Override
    @Transactional
    public ApiResponse notifySellerAboutBike(Long bikeId, String message) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + bikeId));
        User seller = bike.getSeller();
        String notificationText = String.format("Admin Notice regarding your listing \"%s %s\": %s",
                bike.getBrand(), bike.getModel(), (message != null && !message.trim().isEmpty())
                        ? message.trim() : "Please review and update your listing details or upload clear photos.");
        notificationService.sendNotification(seller.getId(), "ADMIN_ALERT", notificationText);
        return new ApiResponse(true, "Notification successfully sent to seller " + seller.getName());
    }

    @Override
    @Transactional
    public ApiResponse clearBikeImages(Long bikeId) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + bikeId));
        bike.getImages().clear();
        bikeRepository.save(bike);

        // Notify seller that images were cleared by admin
        notificationService.sendNotification(
                bike.getSeller().getId(),
                "IMAGE_CLEARED",
                String.format("Admin Alert: Photos for your listing \"%s %s\" were cleared due to quality or verification standards. Please upload authentic, clear photos.",
                        bike.getBrand(), bike.getModel())
        );
        return new ApiResponse(true, "Images cleared successfully for " + bike.getBrand() + " " + bike.getModel());
    }

    @Override
    @Transactional
    public ApiResponse deleteBikeImage(Long bikeId, Long imageId) {
        com.bikehub.entity.BikeImage image = bikeImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with id: " + imageId));
        if (!image.getBike().getId().equals(bikeId)) {
            throw new BadRequestException("Image does not belong to the specified bike");
        }
        bikeImageRepository.delete(image);
        return new ApiResponse(true, "Image deleted successfully");
    }
}
