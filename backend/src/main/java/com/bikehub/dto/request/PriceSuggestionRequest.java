package com.bikehub.dto.request;

import com.bikehub.enums.BikeCondition;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceSuggestionRequest {

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Manufacturing year is required")
    @Min(value = 1990, message = "Year must be 1990 or later")
    @Max(value = 2035, message = "Year cannot be in the future")
    private Integer year;

    @NotNull(message = "Kilometers driven is required")
    @Min(value = 0, message = "Kilometers driven cannot be negative")
    @Builder.Default
    private Integer kmDriven = 0;

    @Builder.Default
    private BikeCondition condition = BikeCondition.GOOD;

    private Integer engineCc;

    public void setKilometersDriven(Integer kilometersDriven) {
        if (kilometersDriven != null) {
            this.kmDriven = kilometersDriven;
        }
    }

    public void setCc(Integer cc) {
        if (cc != null) {
            this.engineCc = cc;
        }
    }
}
