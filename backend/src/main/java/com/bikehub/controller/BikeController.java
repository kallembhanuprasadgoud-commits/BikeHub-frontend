package com.bikehub.controller;

import com.bikehub.dto.request.BikeRequest;
import com.bikehub.dto.response.ApiResponse;
import com.bikehub.dto.response.BikeResponse;
import com.bikehub.dto.response.PageResponse;
import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.BikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/bikes")
@RequiredArgsConstructor
@Tag(name = "Bikes", description = "Endpoints for searching, filtering, comparing, and managing bike listings")
public class BikeController {

    private final BikeService bikeService;

    @GetMapping
    @Operation(summary = "Search and filter bike listings", description = "Public endpoint with multi-criteria dynamic filtering, keyword search, sorting, and pagination")
    public ResponseEntity<PageResponse<BikeResponse>> getBikes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) BikeCondition condition,
            @RequestParam(required = false) String fuelType,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minYear,
            @RequestParam(required = false) Integer maxYear,
            @RequestParam(required = false) BikeStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<BikeResponse> response = bikeService.searchBikes(
                search, brand, city, condition, fuelType, minPrice, maxPrice, minYear, maxYear, status, pageable
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get bike details by ID", description = "Returns complete specifications, image gallery, and seller profile details")
    public ResponseEntity<BikeResponse> getBikeById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        BikeResponse response = bikeService.getBikeById(id, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/compare")
    @Operation(summary = "Compare bikes side-by-side", description = "Fetches 2 to 4 bikes by IDs for side-by-side technical specification comparison")
    public ResponseEntity<List<BikeResponse>> compareBikes(@RequestParam List<Long> ids) {
        List<BikeResponse> response = bikeService.compareBikes(ids);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-listings")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get user's own listings", description = "Returns paginated list of bikes posted by the authenticated user")
    public ResponseEntity<PageResponse<BikeResponse>> getMyListings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        PageResponse<BikeResponse> response = bikeService.getSellerBikes(userDetails.getId(), pageable);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new bike listing", description = "Allows any logged-in user to list a bike for sale with specs and images")
    public ResponseEntity<BikeResponse> createBike(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BikeRequest request
    ) {
        BikeResponse response = bikeService.createBike(userDetails.getId(), request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update an existing bike listing", description = "Modifies bike specifications, price, or image gallery")
    public ResponseEntity<BikeResponse> updateBike(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BikeRequest request
    ) {
        BikeResponse response = bikeService.updateBike(userDetails.getId(), id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update bike listing status", description = "Changes bike status to AVAILABLE, SOLD, or HIDDEN")
    public ResponseEntity<BikeResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam BikeStatus status,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        BikeResponse response = bikeService.updateBikeStatus(userDetails.getId(), id, status);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete bike listing", description = "Removes bike listing and cascades associated images")
    public ResponseEntity<ApiResponse> deleteBike(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        bikeService.deleteBike(userDetails.getId(), isAdmin, id);
        return ResponseEntity.ok(new ApiResponse(true, "Bike listing deleted successfully"));
    }
}
