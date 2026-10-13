package com.bikehub.dto.response;

import com.bikehub.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerSummaryResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String shopName;
    private String city;
    private VerificationStatus verificationStatus;
}
