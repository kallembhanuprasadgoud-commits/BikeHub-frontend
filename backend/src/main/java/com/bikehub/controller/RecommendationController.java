package com.bikehub.controller;

import com.bikehub.dto.response.BikeResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "Endpoints for personalized content-based motorcycle recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    @Operation(summary = "Get personalized bike recommendations", description = "Returns tailored recommendations derived from user interaction history (views, searches, wishlists, chats) with cold-start fallback")
    public ResponseEntity<List<BikeResponse>> getRecommendations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "6") int limit
    ) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        List<BikeResponse> recommendations = recommendationService.getRecommendationsForUser(userId, limit);
        return ResponseEntity.ok(recommendations);
    }
}
