package com.bikehub.service;

import com.bikehub.dto.request.LoginRequest;
import com.bikehub.dto.request.RegisterRequest;
import com.bikehub.dto.response.AuthResponse;
import com.bikehub.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);
}
