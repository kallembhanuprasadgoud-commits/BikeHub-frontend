package com.bikehub.controller;

import com.bikehub.dto.request.SellerVerificationDecisionRequest;
import com.bikehub.dto.request.UserStatusUpdateRequest;
import com.bikehub.dto.response.*;
import com.bikehub.enums.Role;
import com.bikehub.enums.UserStatus;
import com.bikehub.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Endpoints for platform administration, user moderation, seller verification, and business analytics")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/analytics")
    @Operation(summary = "Get platform analytics", description = "Returns dashboard metrics: users, revenue, listings, top brands, cities, and recent orders")
    public ResponseEntity<AdminAnalyticsResponse> getAnalytics() {
        AdminAnalyticsResponse response = adminService.getPlatformAnalytics();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users with filters", description = "Paginated list of platform accounts with role and status filtering")
    public ResponseEntity<PageResponse<UserResponse>> getAllUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<UserResponse> response = adminService.getAllUsers(role, status, pageable);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/users/{id}/status")
    @Operation(summary = "Update user account status", description = "Blocks or activates a user account")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UserStatusUpdateRequest request
    ) {
        UserResponse response = adminService.updateUserStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sellers/pending")
    @Operation(summary = "Get pending seller verifications", description = "Lists dealer applications awaiting admin review")
    public ResponseEntity<PageResponse<SellerProfileResponse>> getPendingSellers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        PageResponse<SellerProfileResponse> response = adminService.getPendingSellerVerifications(pageable);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/sellers/{id}/verify")
    @Operation(summary = "Approve or reject seller verification", description = "Updates dealer verification status (VERIFIED/REJECTED) and sends real-time push alert")
    public ResponseEntity<SellerProfileResponse> decideSellerVerification(
            @PathVariable Long id,
            @Valid @RequestBody SellerVerificationDecisionRequest request
    ) {
        SellerProfileResponse response = adminService.decideSellerVerification(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bikes/{id}/notify-seller")
    @Operation(summary = "Send admin notification to seller", description = "Admin notifies seller regarding listing corrections, clear photo requests, or detail updates")
    public ResponseEntity<ApiResponse> notifySellerAboutBike(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body
    ) {
        String message = body != null ? body.get("message") : null;
        ApiResponse response = adminService.notifySellerAboutBike(id, message);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/bikes/{id}/clear-images")
    @Operation(summary = "Clear all photos of a bike listing", description = "Admin clears blurry, invalid, or mismatched photos for a bike listing")
    public ResponseEntity<ApiResponse> clearBikeImages(@PathVariable Long id) {
        ApiResponse response = adminService.clearBikeImages(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/bikes/{bikeId}/images/{imageId}")
    @Operation(summary = "Delete specific bike photo", description = "Admin removes an individual blurry or invalid photo")
    public ResponseEntity<ApiResponse> deleteBikeImage(@PathVariable Long bikeId, @PathVariable Long imageId) {
        ApiResponse response = adminService.deleteBikeImage(bikeId, imageId);
        return ResponseEntity.ok(response);
    }
}
