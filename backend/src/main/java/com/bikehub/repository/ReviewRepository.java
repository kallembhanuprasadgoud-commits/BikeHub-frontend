package com.bikehub.repository;

import com.bikehub.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    List<Review> findByBikeIdOrderByCreatedAtDesc(Long bikeId);

    boolean existsByReviewerIdAndSellerIdAndBikeId(Long reviewerId, Long sellerId, Long bikeId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.seller.id = :sellerId")
    Double calculateAverageRatingForSeller(@Param("sellerId") Long sellerId);

    long countBySellerId(Long sellerId);
}
