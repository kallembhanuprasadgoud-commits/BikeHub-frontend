package com.bikehub.service;

import com.bikehub.dto.request.LoginRequest;
import com.bikehub.dto.request.RegisterRequest;
import com.bikehub.dto.response.AuthResponse;
import com.bikehub.dto.response.UserResponse;
import com.bikehub.entity.SellerProfile;
import com.bikehub.entity.User;
import com.bikehub.enums.Role;
import com.bikehub.enums.UserStatus;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.SellerProfileRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.security.JwtUtils;
import com.bikehub.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SellerProfileRepository sellerProfileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleBuyer;
    private User sampleSeller;

    @BeforeEach
    void setUp() {
        sampleBuyer = User.builder()
                .id(1L)
                .name("Test Buyer")
                .email("buyer@test.com")
                .password("encodedPassword")
                .role(Role.BUYER)
                .status(UserStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        sampleSeller = User.builder()
                .id(2L)
                .name("Test Seller")
                .email("seller@test.com")
                .password("encodedPassword")
                .role(Role.SELLER)
                .status(UserStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void register_WhenValidBuyerRequest_ReturnsAuthResponse() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test Buyer")
                .email("buyer@test.com")
                .password("rawPassword")
                .role(Role.BUYER)
                .build();

        when(userRepository.existsByEmail("buyer@test.com")).thenReturn(false);
        when(passwordEncoder.encode("rawPassword")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleBuyer);
        when(jwtUtils.generateToken(1L, "buyer@test.com", "Test Buyer", Role.BUYER)).thenReturn("mock.jwt.token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("buyer@test.com", response.getEmail());
        assertEquals(Role.BUYER, response.getRole());
        verify(sellerProfileRepository, never()).save(any());
    }

    @Test
    void register_WhenValidSellerRequest_CreatesSellerProfile() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Test Seller")
                .email("seller@test.com")
                .password("rawPassword")
                .role(Role.SELLER)
                .shopName("Test Moto")
                .city("Pune")
                .build();

        when(userRepository.existsByEmail("seller@test.com")).thenReturn(false);
        when(passwordEncoder.encode("rawPassword")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleSeller);
        when(jwtUtils.generateToken(2L, "seller@test.com", "Test Seller", Role.SELLER)).thenReturn("mock.jwt.seller");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals(Role.SELLER, response.getRole());
        verify(sellerProfileRepository, times(1)).save(any(SellerProfile.class));
    }

    @Test
    void register_WhenEmailAlreadyExists_ThrowsBadRequestException() {
        RegisterRequest request = RegisterRequest.builder()
                .email("buyer@test.com")
                .password("pass123")
                .name("Buyer")
                .build();

        when(userRepository.existsByEmail("buyer@test.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_WhenValidCredentials_ReturnsAuthResponse() {
        LoginRequest request = LoginRequest.builder()
                .email("buyer@test.com")
                .password("rawPassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail("buyer@test.com")).thenReturn(Optional.of(sampleBuyer));
        when(jwtUtils.generateToken(1L, "buyer@test.com", "Test Buyer", Role.BUYER)).thenReturn("valid.token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("valid.token", response.getToken());
        assertEquals("buyer@test.com", response.getEmail());
    }

    @Test
    void login_WhenUserBlocked_ThrowsUnauthorizedException() {
        sampleBuyer.setStatus(UserStatus.BLOCKED);
        LoginRequest request = LoginRequest.builder()
                .email("buyer@test.com")
                .password("rawPassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userRepository.findByEmail("buyer@test.com")).thenReturn(Optional.of(sampleBuyer));

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }

    @Test
    void getCurrentUser_WhenUserExists_ReturnsUserResponse() {
        when(userRepository.findByEmail("buyer@test.com")).thenReturn(Optional.of(sampleBuyer));

        UserResponse response = authService.getCurrentUser("buyer@test.com");

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("buyer@test.com", response.getEmail());
        assertEquals(Role.BUYER, response.getRole());
    }
}
