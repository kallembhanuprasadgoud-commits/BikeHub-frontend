package com.bikehub.dto.response;

import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BikeResponse {

    private Long id;
    private String brand;
    private String model;
    private Integer year;
    private Integer kmDriven;
    private String fuelType;
    private Integer engineCc;
    private BikeCondition condition;
    private BigDecimal price;
    private String description;
    private String city;
    private BikeStatus status;
    private LocalDateTime createdAt;

    private SellerSummaryResponse seller;

    private String primaryImageUrl;

    @Builder.Default
    private List<BikeImageResponse> images = new ArrayList<>();
}
