package com.bikehub.service.impl;

import com.bikehub.dto.request.CreateReviewRequest;
import com.bikehub.dto.response.ReviewResponse;
import com.bikehub.dto.response.SellerReviewStatsResponse;
import com.bikehub.dto.response.UserSummaryResponse;
import com.bikehub.entity.Bike;
import com.bikehub.entity.Review;
import com.bikehub.entity.User;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.ReviewRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.service.NotificationService;
import com.bikehub.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final BikeRepository bikeRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ReviewResponse createReview(Long reviewerId, CreateReviewRequest request) {
        if (reviewerId.equals(request.getSellerId())) {
            throw new BadRequestException("Sellers cannot review their own account");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with id: " + reviewerId));

        User seller = userRepository.findById(request.getSellerId())
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found with id: " + request.getSellerId()));

        Bike bike = null;
        if (request.getBikeId() != null) {
            bike = bikeRepository.findById(request.getBikeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + request.getBikeId()));

            boolean alreadyReviewed = reviewRepository.existsByReviewerIdAndSellerIdAndBikeId(reviewerId, seller.getId(), bike.getId());
            if (alreadyReviewed) {
                throw new BadRequestException("You have already submitted a review for this purchase");
            }
        }

        Review review = Review.builder()
                .reviewer(reviewer)
                .seller(seller)
                .bike(bike)
                .rating(request.getRating())
                .comment(request.getComment().trim())
                .build();

        Review saved = reviewRepository.save(review);

        // Notify the seller
        notificationService.sendNotification(
                seller.getId(),
                "NEW_REVIEW",
                reviewer.getName() + " left you a " + request.getRating() + "-star review!"
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerReviewStatsResponse getSellerReviews(Long sellerId) {
        if (!userRepository.existsById(sellerId)) {
            throw new ResourceNotFoundException("Seller not found with id: " + sellerId);
        }

        List<Review> reviews = reviewRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        Double avg = reviewRepository.calculateAverageRatingForSeller(sellerId);
        long count = reviewRepository.countBySellerId(sellerId);

        List<ReviewResponse> mapped = reviews.stream().map(this::mapToResponse).collect(Collectors.toList());

        return SellerReviewStatsResponse.builder()
                .sellerId(sellerId)
                .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalReviews(count)
                .reviews(mapped)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getBikeReviews(Long bikeId) {
        List<Review> reviews = reviewRepository.findByBikeIdOrderByCreatedAtDesc(bikeId);
        return reviews.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteReview(Long requesterId, boolean isAdmin, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + reviewId));

        if (!isAdmin && !review.getReviewer().getId().equals(requesterId)) {
            throw new UnauthorizedException("You do not have permission to delete this review");
        }

        reviewRepository.delete(review);
    }

    private ReviewResponse mapToResponse(Review r) {
        User reviewer = r.getReviewer();
        UserSummaryResponse reviewerSummary = UserSummaryResponse.builder()
                .id(reviewer.getId())
                .name(reviewer.getName())
                .email(reviewer.getEmail())
                .phone(reviewer.getPhone())
                .build();

        return ReviewResponse.builder()
                .id(r.getId())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .reviewer(reviewerSummary)
                .sellerId(r.getSeller().getId())
                .sellerName(r.getSeller().getName())
                .bikeId(r.getBike() != null ? r.getBike().getId() : null)
                .bikeModel(r.getBike() != null ? r.getBike().getBrand() + " " + r.getBike().getModel() : null)
                .build();
    }
}
