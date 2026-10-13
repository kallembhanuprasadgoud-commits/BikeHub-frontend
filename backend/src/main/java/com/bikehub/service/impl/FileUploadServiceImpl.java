package com.bikehub.service.impl;

import com.bikehub.dto.response.ImageUploadResponse;
import com.bikehub.exception.BadRequestException;
import com.bikehub.service.FileUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileUploadServiceImpl implements FileUploadService {

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/jpg"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    @Value("${server.port:8080}")
    private String serverPort;

    private final Path uploadLocation = Paths.get("uploads");

    public FileUploadServiceImpl() {
        try {
            if (!Files.exists(uploadLocation)) {
                Files.createDirectories(uploadLocation);
            }
        } catch (IOException e) {
            log.error("Could not initialize upload folder: {}", e.getMessage());
        }
    }

    @Override
    public ImageUploadResponse uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds 5MB limit");
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        String lowerName = originalFilename != null ? originalFilename.toLowerCase() : "";
        boolean isImageExtension = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
                || lowerName.endsWith(".png") || lowerName.endsWith(".webp") || lowerName.endsWith(".jfif")
                || lowerName.endsWith(".gif") || lowerName.endsWith(".bmp") || lowerName.endsWith(".avif");
        boolean isImageMime = contentType != null && (contentType.toLowerCase().startsWith("image/") || ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase()));

        if (!isImageMime && !isImageExtension) {
            throw new BadRequestException("Invalid file type. Allowed formats: JPG, JPEG, PNG, WEBP");
        }

        try {
            if (!Files.exists(uploadLocation)) {
                Files.createDirectories(uploadLocation);
            }

            String cleanName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "image.jpg";
            String uniqueFileName = UUID.randomUUID() + "_" + cleanName;

            Path targetPath = uploadLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "http://localhost:" + serverPort + "/uploads/" + uniqueFileName;

            return ImageUploadResponse.builder()
                    .imageUrl(fileUrl)
                    .fileName(uniqueFileName)
                    .size(file.getSize())
                    .contentType(contentType != null ? contentType : "image/jpeg")
                    .message("Image uploaded successfully")
                    .build();

        } catch (IOException e) {
            log.error("Failed to store file: {}", e.getMessage(), e);
            throw new BadRequestException("Could not store image: " + e.getMessage());
        }
    }

    @Override
    public List<ImageUploadResponse> uploadMultipleImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No files were provided for upload");
        }
        List<ImageUploadResponse> responses = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                responses.add(uploadImage(file));
            }
        }
        if (responses.isEmpty()) {
            throw new BadRequestException("All uploaded files were empty");
        }
        return responses;
    }
}
