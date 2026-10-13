package com.bikehub.service;

import com.bikehub.dto.response.ImageUploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileUploadService {

    ImageUploadResponse uploadImage(MultipartFile file);

    List<ImageUploadResponse> uploadMultipleImages(List<MultipartFile> files);
}
