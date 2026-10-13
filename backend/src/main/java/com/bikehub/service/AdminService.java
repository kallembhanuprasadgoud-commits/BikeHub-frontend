package com.bikehub.service;

import com.bikehub.dto.request.SellerVerificationDecisionRequest;
import com.bikehub.dto.request.SellerVerificationRequest;
import com.bikehub.dto.response.AdminAnalyticsResponse;
import com.bikehub.dto.response.PageResponse;
import com.bikehub.dto.response.SellerProfileResponse;
import com.bikehub.dto.response.UserResponse;
import com.bikehub.enums.Role;
import com.bikehub.enums.UserStatus;
import org.springframework.data.domain.Pageable;

public interface AdminService {

    SellerProfileResponse submitSellerVerification(Long sellerId, SellerVerificationRequest request);

    SellerProfileResponse getSellerVerificationStatus(Long sellerId);

    PageResponse<SellerProfileResponse> getPendingSellerVerifications(Pageable pageable);

    SellerProfileResponse decideSellerVerification(Long sellerProfileId, SellerVerificationDecisionRequest request);

    PageResponse<UserResponse> getAllUsers(Role role, UserStatus status, Pageable pageable);

    UserResponse updateUserStatus(Long userId, UserStatus status);

    AdminAnalyticsResponse getPlatformAnalytics();

    com.bikehub.dto.response.ApiResponse notifySellerAboutBike(Long bikeId, String message);

    com.bikehub.dto.response.ApiResponse clearBikeImages(Long bikeId);

    com.bikehub.dto.response.ApiResponse deleteBikeImage(Long bikeId, Long imageId);
}
