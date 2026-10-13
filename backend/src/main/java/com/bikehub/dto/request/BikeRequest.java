package com.bikehub.dto.request;

import com.bikehub.enums.BikeCondition;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BikeRequest {

    @NotBlank(message = "Brand is required (e.g., Royal Enfield, Yamaha, Honda)")
    @Size(max = 80, message = "Brand must not exceed 80 characters")
    private String brand;

    @NotBlank(message = "Model is required (e.g., Classic 350, R15 V4)")
    @Size(max = 100, message = "Model must not exceed 100 characters")
    private String model;

    @NotNull(message = "Manufacturing year is required")
    @Min(value = 1980, message = "Year must be 1980 or later")
    @Max(value = 2035, message = "Year cannot be in the far future")
    private Integer year;

    @Min(value = 0, message = "Kilometers driven cannot be negative")
    @Builder.Default
    private Integer kmDriven = 0;

    @Builder.Default
    private String fuelType = "Petrol";

    private Integer engineCc;

    @NotNull(message = "Bike condition is required (NEW, EXCELLENT, GOOD, FAIR, POOR)")
    private BikeCondition condition;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "100.00", message = "Price must be at least ₹100.00")
    private BigDecimal price;

    private String description;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    @Builder.Default
    private Integer primaryImageIndex = 0;
}
