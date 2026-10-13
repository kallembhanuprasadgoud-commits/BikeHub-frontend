package com.bikehub.service;

import com.bikehub.dto.request.PhotoMatchVerificationRequest;
import com.bikehub.dto.request.PriceSuggestionRequest;
import com.bikehub.dto.response.ImageConditionAnalysisResponse;
import com.bikehub.dto.response.PhotoMatchVerificationResponse;
import com.bikehub.dto.response.PriceSuggestionResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AiService {

    PriceSuggestionResponse suggestPrice(PriceSuggestionRequest request);

    ImageConditionAnalysisResponse analyzeImageCondition(String imageUrl, MultipartFile file);

    PhotoMatchVerificationResponse verifyPhotoMatch(PhotoMatchVerificationRequest request, MultipartFile file);
}

