package com.bikehub.service;

import com.bikehub.dto.request.PriceSuggestionRequest;
import com.bikehub.dto.response.BikeResponse;
import com.bikehub.dto.response.ImageConditionAnalysisResponse;
import com.bikehub.dto.response.PriceSuggestionResponse;
import com.bikehub.entity.Bike;
import com.bikehub.entity.User;
import com.bikehub.entity.UserActivity;
import com.bikehub.enums.ActionType;
import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import com.bikehub.enums.Role;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.UserActivityRepository;
import com.bikehub.service.impl.AiServiceImpl;
import com.bikehub.service.impl.RecommendationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiAndRecommendationTest {

    @Mock
    private BikeRepository bikeRepository;

    @Mock
    private UserActivityRepository userActivityRepository;

    @Mock
    private BikeService bikeService;

    @InjectMocks
    private AiServiceImpl aiService;

    @InjectMocks
    private RecommendationServiceImpl recommendationService;

    private Bike sampleBike1;
    private Bike sampleBike2;
    private User sampleSeller;
    private User sampleBuyer;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(aiService, "aiServiceUrl", "http://localhost:5000");

        sampleSeller = User.builder().id(2L).name("Seller").role(Role.SELLER).build();
        sampleBuyer = User.builder().id(4L).name("Buyer").role(Role.BUYER).build();

        sampleBike1 = Bike.builder()
                .id(1L)
                .seller(sampleSeller)
                .brand("Royal Enfield")
                .model("Classic 350")
                .price(new BigDecimal("165000.00"))
                .city("Pune")
                .status(BikeStatus.AVAILABLE)
                .images(new ArrayList<>())
                .build();

        sampleBike2 = Bike.builder()
                .id(2L)
                .seller(sampleSeller)
                .brand("Yamaha")
                .model("R15 V4")
                .price(new BigDecimal("152000.00"))
                .city("Bangalore")
                .status(BikeStatus.AVAILABLE)
                .images(new ArrayList<>())
                .build();
    }

    @Test
    void suggestPrice_WhenValidRoyalEnfield_CalculatesDepreciationAndPriceRange() {
        PriceSuggestionRequest request = PriceSuggestionRequest.builder()
                .brand("Royal Enfield")
                .model("Classic 350")
                .year(2022)
                .kmDriven(12000)
                .condition(BikeCondition.EXCELLENT)
                .engineCc(349)
                .build();

        PriceSuggestionResponse response = aiService.suggestPrice(request);

        assertNotNull(response);
        assertNotNull(response.getEstimatedPrice());
        assertTrue(response.getEstimatedPrice().compareTo(BigDecimal.ZERO) > 0);
        assertTrue(response.getMinSuggestedPrice().compareTo(response.getEstimatedPrice()) <= 0);
        assertTrue(response.getMaxSuggestedPrice().compareTo(response.getEstimatedPrice()) >= 0);
        assertEquals("HIGH", response.getMarketDemand());
        assertFalse(response.getContributingFactors().isEmpty());
    }

    @Test
    void suggestPrice_WhenNewCondition_HasHigherValueThanPoor() {
        PriceSuggestionRequest newRequest = PriceSuggestionRequest.builder()
                .brand("KTM")
                .model("Duke 390")
                .year(2023)
                .kmDriven(3000)
                .condition(BikeCondition.NEW)
                .build();

        PriceSuggestionRequest poorRequest = PriceSuggestionRequest.builder()
                .brand("KTM")
                .model("Duke 390")
                .year(2023)
                .kmDriven(3000)
                .condition(BikeCondition.POOR)
                .build();

        PriceSuggestionResponse newResp = aiService.suggestPrice(newRequest);
        PriceSuggestionResponse poorResp = aiService.suggestPrice(poorRequest);

        assertTrue(newResp.getEstimatedPrice().compareTo(poorResp.getEstimatedPrice()) > 0);
    }

    @Test
    void analyzeImageCondition_ReturnsConditionAndConfidence() {
        ImageConditionAnalysisResponse response = aiService.analyzeImageCondition("https://example.com/bike.jpg", null);

        assertNotNull(response);
        assertEquals(BikeCondition.EXCELLENT, response.getCondition());
        assertTrue(response.getConfidenceScore() >= 0.85);
        assertFalse(response.getDetectedFeatures().isEmpty());
    }

    @Test
    void getRecommendations_WhenUserHasActivity_ReturnsPersonalizedResults() {
        UserActivity activity = UserActivity.builder()
                .id(1L)
                .user(sampleBuyer)
                .bike(sampleBike1)
                .actionType(ActionType.VIEW)
                .createdAt(LocalDateTime.now())
                .build();

        when(userActivityRepository.findByUserIdOrderByCreatedAtDesc(4L)).thenReturn(List.of(activity));
        when(bikeRepository.findAll()).thenReturn(List.of(sampleBike1, sampleBike2));
        when(bikeService.getBikeById(1L, null)).thenReturn(BikeResponse.builder().id(1L).brand("Royal Enfield").build());
        when(bikeService.getBikeById(2L, null)).thenReturn(BikeResponse.builder().id(2L).brand("Yamaha").build());

        List<BikeResponse> results = recommendationService.getRecommendationsForUser(4L, 2);

        assertNotNull(results);
        assertFalse(results.isEmpty());
        // Since buyer viewed Royal Enfield, Royal Enfield should rank first
        assertEquals("Royal Enfield", results.get(0).getBrand());
    }
}
