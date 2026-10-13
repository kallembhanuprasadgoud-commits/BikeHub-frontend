package com.bikehub.controller;

import com.bikehub.dto.response.ApiResponse;
import com.bikehub.dto.response.BikeResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist", description = "Endpoints for managing buyer's favorite/saved bikes")
@SecurityRequirement(name = "bearerAuth")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user's wishlist", description = "Returns all bikes saved by the authenticated user")
    public ResponseEntity<List<BikeResponse>> getWishlist(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<BikeResponse> wishlist = wishlistService.getUserWishlist(userDetails.getId());
        return ResponseEntity.ok(wishlist);
    }

    @PostMapping("/{bikeId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Add bike to wishlist", description = "Bookmarks a bike for the authenticated user")
    public ResponseEntity<ApiResponse> addToWishlist(
            @PathVariable Long bikeId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        wishlistService.addToWishlist(userDetails.getId(), bikeId);
        return ResponseEntity.ok(new ApiResponse(true, "Bike added to wishlist successfully"));
    }

    @DeleteMapping("/{bikeId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove bike from wishlist", description = "Removes a bookmarked bike from user's wishlist")
    public ResponseEntity<ApiResponse> removeFromWishlist(
            @PathVariable Long bikeId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        wishlistService.removeFromWishlist(userDetails.getId(), bikeId);
        return ResponseEntity.ok(new ApiResponse(true, "Bike removed from wishlist"));
    }

    @GetMapping("/check/{bikeId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Check if bike is in wishlist", description = "Returns boolean flag whether bike is already wishlisted by the user")
    public ResponseEntity<Map<String, Boolean>> isWishlisted(
            @PathVariable Long bikeId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean exists = wishlistService.isWishlisted(userDetails.getId(), bikeId);
        return ResponseEntity.ok(Collections.singletonMap("isWishlisted", exists));
    }
}
