package com.bikehub.controller;

import com.bikehub.dto.request.CreateReviewRequest;
import com.bikehub.dto.response.ApiResponse;
import com.bikehub.dto.response.ReviewResponse;
import com.bikehub.dto.response.SellerReviewStatsResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Endpoints for buyer ratings and seller feedback")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Submit a review", description = "Allows buyers to post rating (1-5) and feedback for a seller")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        ReviewResponse response = reviewService.createReview(userDetails.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/seller/{sellerId}")
    @Operation(summary = "Get seller reviews and average rating", description = "Public endpoint returning seller feedback aggregate and reviews")
    public ResponseEntity<SellerReviewStatsResponse> getSellerReviews(@PathVariable Long sellerId) {
        SellerReviewStatsResponse response = reviewService.getSellerReviews(sellerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bike/{bikeId}")
    @Operation(summary = "Get reviews for a bike model", description = "Public endpoint listing buyer feedback related to a specific bike")
    public ResponseEntity<List<ReviewResponse>> getBikeReviews(@PathVariable Long bikeId) {
        List<ReviewResponse> response = reviewService.getBikeReviews(bikeId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete review", description = "Removes a review (allowed for the reviewer or admin)")
    public ResponseEntity<ApiResponse> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        reviewService.deleteReview(userDetails.getId(), isAdmin, id);
        return ResponseEntity.ok(new ApiResponse(true, "Review deleted successfully"));
    }
}
