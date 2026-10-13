package com.bikehub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoMatchVerificationResponse {

    private boolean matches;
    private double matchScore; // e.g. 0.94 (94%)
    private String detectedCategory; // e.g. "Cruiser / Retro Classic", "Naked Sports", "Supersport"
    private String detectedBrand;
    private boolean isClearImage;
    private String explanation;
    private List<String> detectedFeatures;
    private String recommendation;
}
