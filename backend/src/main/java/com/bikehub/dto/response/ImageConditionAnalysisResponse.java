package com.bikehub.dto.response;

import com.bikehub.enums.BikeCondition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageConditionAnalysisResponse {

    private BikeCondition condition;
    private double confidenceScore;
    private boolean damageDetected;
    private List<String> detectedFeatures;
    private String summary;
    private String recommendation;
}
