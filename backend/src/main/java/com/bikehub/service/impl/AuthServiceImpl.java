package com.bikehub.service.impl;

import com.bikehub.dto.request.LoginRequest;
import com.bikehub.dto.request.RegisterRequest;
import com.bikehub.dto.response.AuthResponse;
import com.bikehub.dto.response.SellerProfileResponse;
import com.bikehub.dto.response.UserResponse;
import com.bikehub.entity.SellerProfile;
import com.bikehub.entity.User;
import com.bikehub.enums.Role;
import com.bikehub.enums.UserStatus;
import com.bikehub.enums.VerificationStatus;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.SellerProfileRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.security.JwtUtils;
import com.bikehub.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        Role assignedRole = request.getRole() != null ? request.getRole() : Role.BUYER;

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(assignedRole)
                .status(UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        if (assignedRole == Role.SELLER) {
            SellerProfile profile = SellerProfile.builder()
                    .user(savedUser)
                    .shopName(request.getShopName() != null ? request.getShopName() : request.getName() + "'s Shop")
                    .city(request.getCity())
                    .address(request.getAddress())
                    .verificationStatus(VerificationStatus.PENDING)
                    .build();
            sellerProfileRepository.save(profile);
            savedUser.setSellerProfile(profile);
        }

        String token = jwtUtils.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getName(), savedUser.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new UnauthorizedException("Your account has been blocked by administrator. Please contact support.");
        }

        String token = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getName(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        SellerProfileResponse sellerProfileResponse = null;
        if (user.getSellerProfile() != null) {
            SellerProfile sp = user.getSellerProfile();
            sellerProfileResponse = SellerProfileResponse.builder()
                    .id(sp.getId())
                    .shopName(sp.getShopName())
                    .address(sp.getAddress())
                    .city(sp.getCity())
                    .verificationStatus(sp.getVerificationStatus())
                    .documentUrl(sp.getDocumentUrl())
                    .verifiedAt(sp.getVerifiedAt())
                    .build();
        }

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .sellerProfile(sellerProfileResponse)
                .build();
    }
}
