package com.bikehub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerReviewStatsResponse {

    private Long sellerId;
    private double averageRating;
    private long totalReviews;

    @Builder.Default
    private List<ReviewResponse> reviews = new ArrayList<>();
}
