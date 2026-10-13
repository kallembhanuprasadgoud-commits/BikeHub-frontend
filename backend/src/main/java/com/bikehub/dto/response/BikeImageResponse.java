package com.bikehub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BikeImageResponse {

    private Long id;
    private String imageUrl;
    private Boolean isPrimary;
}
