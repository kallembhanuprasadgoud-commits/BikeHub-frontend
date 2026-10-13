package com.bikehub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerVerificationRequest {

    @NotBlank(message = "Shop name cannot be blank")
    private String shopName;

    @NotBlank(message = "Address cannot be blank")
    private String address;

    @NotBlank(message = "City cannot be blank")
    private String city;

    @NotBlank(message = "Document URL (GST, Dealer ID, or Trade License) is required")
    private String documentUrl;
}
