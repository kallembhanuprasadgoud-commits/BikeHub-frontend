package com.bikehub.dto.response;

import com.bikehub.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileResponse {

    private Long id;
    private String shopName;
    private String address;
    private String city;
    private VerificationStatus verificationStatus;
    private String documentUrl;
    private LocalDateTime verifiedAt;
}
