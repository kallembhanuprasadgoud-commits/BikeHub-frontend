package com.bikehub.service.impl;

import com.bikehub.dto.response.BikeResponse;
import com.bikehub.entity.Bike;
import com.bikehub.entity.UserActivity;
import com.bikehub.enums.BikeStatus;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.UserActivityRepository;
import com.bikehub.service.BikeService;
import com.bikehub.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final UserActivityRepository userActivityRepository;
    private final BikeRepository bikeRepository;
    private final BikeService bikeService;

    @Override
    @Transactional(readOnly = true)
    public List<BikeResponse> getRecommendationsForUser(Long userId, int limit) {
        int safeLimit = limit > 0 ? limit : 6;

        if (userId == null) {
            return getColdStartRecommendations(safeLimit);
        }

        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (activities.isEmpty()) {
            return getColdStartRecommendations(safeLimit);
        }

        // 1. Build Content-Based User Preference Profile
        Map<String, Double> brandWeights = new HashMap<>();
        List<BigDecimal> interactedPrices = new ArrayList<>();
        Map<String, Double> cityWeights = new HashMap<>();

        for (UserActivity act : activities) {
            double weight = switch (act.getActionType()) {
                case CHAT -> 4.0;
                case WISHLIST -> 3.0;
                case SEARCH -> 2.0;
                case VIEW -> 1.0;
            };

            if (act.getBike() != null) {
                Bike b = act.getBike();
                String brand = b.getBrand().trim().toLowerCase();
                brandWeights.put(brand, brandWeights.getOrDefault(brand, 0.0) + weight);

                if (b.getPrice() != null) {
                    interactedPrices.add(b.getPrice());
                }

                if (b.getCity() != null) {
                    String city = b.getCity().trim().toLowerCase();
                    cityWeights.put(city, cityWeights.getOrDefault(city, 0.0) + weight);
                }
            } else if (act.getSearchTerm() != null) {
                // Check if search term mentions known brands
                String query = act.getSearchTerm().trim().toLowerCase();
                for (String brand : List.of("royal enfield", "yamaha", "ktm", "honda", "kawasaki", "tvs", "bajaj", "bmw", "triumph")) {
                    if (query.contains(brand)) {
                        brandWeights.put(brand, brandWeights.getOrDefault(brand, 0.0) + weight);
                    }
                }
            }
        }

        // Calculate average target price
        double targetPrice = 180000.0;
        if (!interactedPrices.isEmpty()) {
            targetPrice = interactedPrices.stream()
                    .mapToDouble(BigDecimal::doubleValue)
                    .average()
                    .orElse(180000.0);
        }

        // 2. Score Candidate Available Bikes
        List<Bike> availableBikes = bikeRepository.findAll().stream()
                .filter(b -> b.getStatus() == BikeStatus.AVAILABLE)
                .filter(b -> !b.getSeller().getId().equals(userId))
                .toList();

        final double finalTargetPrice = targetPrice;

        List<Map.Entry<Bike, Double>> scoredBikes = new ArrayList<>();
        for (Bike bike : availableBikes) {
            double score = 0.0;

            // Brand Affinity Match (up to 50 pts)
            String bikeBrand = bike.getBrand().trim().toLowerCase();
            if (brandWeights.containsKey(bikeBrand)) {
                score += Math.min(50.0, brandWeights.get(bikeBrand) * 10.0);
            }

            // Price Proximity Match (up to 35 pts)
            double bikePrice = bike.getPrice().doubleValue();
            double priceDiffRatio = Math.abs(bikePrice - finalTargetPrice) / Math.max(1.0, finalTargetPrice);
            if (priceDiffRatio <= 0.4) {
                score += 35.0 * (1.0 - (priceDiffRatio / 0.4));
            }

            // City Match (up to 15 pts)
            if (bike.getCity() != null) {
                String bikeCity = bike.getCity().trim().toLowerCase();
                if (cityWeights.containsKey(bikeCity)) {
                    score += 15.0;
                }
            }

            scoredBikes.add(new AbstractMap.SimpleEntry<>(bike, score));
        }

        // Sort descending by calculated affinity score
        scoredBikes.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        List<BikeResponse> recommended = scoredBikes.stream()
                .limit(safeLimit)
                .map(entry -> bikeService.getBikeById(entry.getKey().getId(), null))
                .collect(Collectors.toList());

        if (recommended.isEmpty()) {
            return getColdStartRecommendations(safeLimit);
        }

        log.info("Generated {} personalized content-based recommendations for user {}", recommended.size(), userId);
        return recommended;
    }

    private List<BikeResponse> getColdStartRecommendations(int limit) {
        // Fallback for cold start: newest available motorcycles
        return bikeRepository.findAll(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .getContent().stream()
                .filter(b -> b.getStatus() == BikeStatus.AVAILABLE)
                .map(b -> bikeService.getBikeById(b.getId(), null))
                .collect(Collectors.toList());
    }
}
