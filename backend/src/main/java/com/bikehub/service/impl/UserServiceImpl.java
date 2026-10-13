package com.bikehub.service.impl;

import com.bikehub.dto.request.ChangePasswordRequest;
import com.bikehub.dto.request.UpdateProfileRequest;
import com.bikehub.dto.response.SellerProfileResponse;
import com.bikehub.dto.response.UserResponse;
import com.bikehub.entity.SellerProfile;
import com.bikehub.entity.User;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.repository.UserRepository;
import com.bikehub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setName(request.getName().trim());
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
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
