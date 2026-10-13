package com.bikehub.controller;

import com.bikehub.dto.request.SellerVerificationRequest;
import com.bikehub.dto.response.SellerProfileResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.AdminService;
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
@RequestMapping("/api/seller/verification")
@RequiredArgsConstructor
@Tag(name = "Seller Verification", description = "Endpoints for sellers to submit business dealership documents and track verification status")
@SecurityRequirement(name = "bearerAuth")
public class SellerVerificationController {

    private final AdminService adminService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit seller verification documents", description = "Allows registered users to submit shop details and verification documents")
    public ResponseEntity<SellerProfileResponse> submitVerification(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody SellerVerificationRequest request
    ) {
        SellerProfileResponse response = adminService.submitSellerVerification(userDetails.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Check seller verification status", description = "Returns current verification status (PENDING, VERIFIED, REJECTED)")
    public ResponseEntity<SellerProfileResponse> getVerificationStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        SellerProfileResponse response = adminService.getSellerVerificationStatus(userDetails.getId());
        return ResponseEntity.ok(response);
    }
}
