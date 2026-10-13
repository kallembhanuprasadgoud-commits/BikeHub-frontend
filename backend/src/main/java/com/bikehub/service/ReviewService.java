package com.bikehub.service;

import com.bikehub.dto.request.CreateReviewRequest;
import com.bikehub.dto.response.ReviewResponse;
import com.bikehub.dto.response.SellerReviewStatsResponse;

import java.util.List;

public interface ReviewService {

    ReviewResponse createReview(Long reviewerId, CreateReviewRequest request);

    SellerReviewStatsResponse getSellerReviews(Long sellerId);

    List<ReviewResponse> getBikeReviews(Long bikeId);

    void deleteReview(Long requesterId, boolean isAdmin, Long reviewId);
}
