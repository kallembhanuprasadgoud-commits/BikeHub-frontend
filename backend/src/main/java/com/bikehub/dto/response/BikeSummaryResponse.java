package com.bikehub.dto.response;

import com.bikehub.enums.BikeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BikeSummaryResponse {

    private Long id;
    private String brand;
    private String model;
    private Integer year;
    private BigDecimal price;
    private String city;
    private String primaryImageUrl;
    private BikeStatus status;
}
