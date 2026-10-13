package com.bikehub.service.impl;

import com.bikehub.dto.response.BikeResponse;
import com.bikehub.entity.Bike;
import com.bikehub.entity.User;
import com.bikehub.entity.Wishlist;
import com.bikehub.enums.ActionType;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.repository.WishlistRepository;
import com.bikehub.service.BikeService;
import com.bikehub.service.UserActivityService;
import com.bikehub.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final BikeRepository bikeRepository;
    private final BikeService bikeService;
    private final UserActivityService userActivityService;

    @Override
    @Transactional
    public void addToWishlist(Long userId, Long bikeId) {
        if (wishlistRepository.existsByUserIdAndBikeId(userId, bikeId)) {
            throw new BadRequestException("Bike is already in your wishlist");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResourceNotFoundException("Bike not found with id: " + bikeId));

        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .bike(bike)
                .build();

        wishlistRepository.save(wishlist);

        // Track WISHLIST action for AI recommendations
        userActivityService.logActivity(userId, bikeId, ActionType.WISHLIST, null);
    }

    @Override
    @Transactional
    public void removeFromWishlist(Long userId, Long bikeId) {
        wishlistRepository.deleteByUserIdAndBikeId(userId, bikeId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BikeResponse> getUserWishlist(Long userId) {
        List<Wishlist> wishlistEntries = wishlistRepository.findByUserId(userId);

        return wishlistEntries.stream()
                .map(w -> bikeService.getBikeById(w.getBike().getId(), null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isWishlisted(Long userId, Long bikeId) {
        return wishlistRepository.existsByUserIdAndBikeId(userId, bikeId);
    }
}
