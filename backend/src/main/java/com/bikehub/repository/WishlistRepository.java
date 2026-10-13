package com.bikehub.repository;

import com.bikehub.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    Optional<Wishlist> findByUserIdAndBikeId(Long userId, Long bikeId);

    boolean existsByUserIdAndBikeId(Long userId, Long bikeId);

    List<Wishlist> findByUserId(Long userId);

    void deleteByUserIdAndBikeId(Long userId, Long bikeId);
}
