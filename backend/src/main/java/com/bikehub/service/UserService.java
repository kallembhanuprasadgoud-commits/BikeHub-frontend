package com.bikehub.service;

import com.bikehub.dto.request.ChangePasswordRequest;
import com.bikehub.dto.request.UpdateProfileRequest;
import com.bikehub.dto.response.UserResponse;

public interface UserService {

    UserResponse getUserProfile(Long userId);

    UserResponse updateProfile(Long userId, UpdateProfileRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);
}
