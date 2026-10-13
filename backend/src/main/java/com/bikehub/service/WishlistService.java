package com.bikehub.service;

import com.bikehub.dto.response.BikeResponse;

import java.util.List;

public interface WishlistService {

    void addToWishlist(Long userId, Long bikeId);

    void removeFromWishlist(Long userId, Long bikeId);

    List<BikeResponse> getUserWishlist(Long userId);

    boolean isWishlisted(Long userId, Long bikeId);
}
