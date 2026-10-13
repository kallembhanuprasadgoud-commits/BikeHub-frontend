package com.bikehub.service;

import com.bikehub.dto.request.BikeRequest;
import com.bikehub.dto.response.BikeResponse;
import com.bikehub.dto.response.PageResponse;
import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface BikeService {

    BikeResponse createBike(Long sellerId, BikeRequest request);

    BikeResponse updateBike(Long sellerId, Long bikeId, BikeRequest request);

    void deleteBike(Long requesterId, boolean isAdmin, Long bikeId);

    BikeResponse getBikeById(Long id, Long currentUserId);

    PageResponse<BikeResponse> searchBikes(
            String search,
            String brand,
            String city,
            BikeCondition condition,
            String fuelType,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minYear,
            Integer maxYear,
            BikeStatus status,
            Pageable pageable
    );

    List<BikeResponse> compareBikes(List<Long> ids);

    PageResponse<BikeResponse> getSellerBikes(Long sellerId, Pageable pageable);

    BikeResponse updateBikeStatus(Long sellerId, Long bikeId, BikeStatus status);
}
