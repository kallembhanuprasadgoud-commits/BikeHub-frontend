package com.bikehub.controller;

import com.bikehub.dto.response.ImageUploadResponse;
import com.bikehub.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "Uploads", description = "Endpoints for uploading motorcycle photos and seller verification documents")
@SecurityRequirement(name = "bearerAuth")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload image file", description = "Uploads JPG, PNG, or WEBP image up to 5MB and returns public URL")
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "files", required = false) java.util.List<MultipartFile> files
    ) {
        MultipartFile target = file;
        if (target == null && files != null && !files.isEmpty()) {
            target = files.get(0);
        }
        ImageUploadResponse response = fileUploadService.uploadImage(target);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload multiple image files", description = "Uploads multiple images up to 5MB each and returns list of public URLs")
    public ResponseEntity<java.util.List<String>> uploadMultipleImages(
            @RequestParam(value = "files", required = false) java.util.List<MultipartFile> files,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
        java.util.List<MultipartFile> targetList = files != null ? new java.util.ArrayList<>(files) : new java.util.ArrayList<>();
        if (targetList.isEmpty() && file != null) {
            targetList.add(file);
        }
        java.util.List<ImageUploadResponse> responses = fileUploadService.uploadMultipleImages(targetList);
        java.util.List<String> urls = responses.stream().map(ImageUploadResponse::getImageUrl).toList();
        return ResponseEntity.ok(urls);
    }
}
