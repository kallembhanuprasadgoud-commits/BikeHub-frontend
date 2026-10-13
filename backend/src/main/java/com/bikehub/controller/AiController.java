package com.bikehub.controller;

import com.bikehub.dto.request.PhotoMatchVerificationRequest;
import com.bikehub.dto.request.PriceSuggestionRequest;
import com.bikehub.dto.response.ImageConditionAnalysisResponse;
import com.bikehub.dto.response.PhotoMatchVerificationResponse;
import com.bikehub.dto.response.PriceSuggestionResponse;
import com.bikehub.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Services", description = "Endpoints for AI-driven price prediction, valuation heuristics, and image condition assessment")
public class AiController {

    private final AiService aiService;

    @PostMapping({"/price-suggestion", "/suggest-price"})
    @Operation(summary = "Get suggested fair market price", description = "Calculates estimated market value, min/max recommended range, and depreciation breakdown based on vehicle age, odometer, and brand")
    public ResponseEntity<PriceSuggestionResponse> suggestPrice(@Valid @RequestBody PriceSuggestionRequest request) {
        PriceSuggestionResponse response = aiService.suggestPrice(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/condition-analysis", "/analyze-condition"})
    @Operation(summary = "Analyze motorcycle image condition", description = "Analyzes motorcycle photograph and returns condition rating, confidence score, and detected visual wear")
    public ResponseEntity<ImageConditionAnalysisResponse> analyzeCondition(
            @RequestBody(required = false) java.util.Map<String, Object> body,
            @RequestParam(required = false) String imageUrl,
            @RequestPart(required = false) MultipartFile file
    ) {
        String finalImageUrl = imageUrl;
        if (finalImageUrl == null && body != null && body.get("imageUrl") != null) {
            finalImageUrl = String.valueOf(body.get("imageUrl"));
        }
        ImageConditionAnalysisResponse response = aiService.analyzeImageCondition(finalImageUrl, file);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/verify-photo-match", "/photo-match-verification"})
    @Operation(summary = "Verify vehicle name and photo consistency", description = "Uses AI computer vision to cross-reference the uploaded photograph against declared Brand and Model")
    public ResponseEntity<PhotoMatchVerificationResponse> verifyPhotoMatch(
            @RequestBody(required = false) PhotoMatchVerificationRequest request,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String imageUrl,
            @RequestPart(required = false) MultipartFile file
    ) {
        PhotoMatchVerificationRequest req = request;
        if (req == null) {
            req = PhotoMatchVerificationRequest.builder()
                    .brand(brand != null ? brand : "")
                    .model(model != null ? model : "")
                    .imageUrl(imageUrl)
                    .build();
        }
        PhotoMatchVerificationResponse response = aiService.verifyPhotoMatch(req, file);
        return ResponseEntity.ok(response);
    }
}
