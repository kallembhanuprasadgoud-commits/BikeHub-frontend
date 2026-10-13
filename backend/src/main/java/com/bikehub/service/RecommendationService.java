package com.bikehub.service;

import com.bikehub.dto.response.BikeResponse;

import java.util.List;

public interface RecommendationService {

    List<BikeResponse> getRecommendationsForUser(Long userId, int limit);
}
