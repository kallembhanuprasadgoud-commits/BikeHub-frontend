package com.bikehub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceSuggestionResponse {

    private BigDecimal estimatedPrice;
    private BigDecimal minSuggestedPrice;
    private BigDecimal maxSuggestedPrice;
    private double confidenceScore;
    private String marketDemand;
    private double depreciationPercent;
    private String explanation;
    private List<String> contributingFactors;

    public BigDecimal getSuggestedPrice() {
        return estimatedPrice;
    }

    public BigDecimal getMinPrice() {
        return minSuggestedPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxSuggestedPrice;
    }
}
