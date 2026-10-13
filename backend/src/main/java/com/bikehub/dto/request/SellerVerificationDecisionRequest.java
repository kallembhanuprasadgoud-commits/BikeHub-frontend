package com.bikehub.dto.request;

import com.bikehub.enums.VerificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerVerificationDecisionRequest {

    @NotNull(message = "Decision status is required (VERIFIED or REJECTED)")
    private VerificationStatus status;

    private String adminRemarks;
}
