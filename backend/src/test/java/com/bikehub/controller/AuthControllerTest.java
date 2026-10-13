package com.bikehub.controller;

import com.bikehub.dto.request.LoginRequest;
import com.bikehub.dto.request.RegisterRequest;
import com.bikehub.dto.response.AuthResponse;
import com.bikehub.enums.Role;
import com.bikehub.security.CustomUserDetailsService;
import com.bikehub.security.JwtAuthenticationEntryPoint;
import com.bikehub.security.JwtUtils;
import com.bikehub.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Test
    @DisplayName("POST /api/auth/register should return 201 Created on valid request")
    void testRegister_Success() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Arjun Nair")
                .email("arjun@example.com")
                .password("password123")
                .phone("+919876543210")
                .role(Role.BUYER)
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("jwt.mock.token.test")
                .tokenType("Bearer")
                .id(10L)
                .name("Arjun Nair")
                .email("arjun@example.com")
                .role(Role.BUYER)
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt.mock.token.test"))
                .andExpect(jsonPath("$.name").value("Arjun Nair"))
                .andExpect(jsonPath("$.role").value("BUYER"));
    }

    @Test
    @DisplayName("POST /api/auth/register should return 400 Bad Request on invalid email")
    void testRegister_InvalidEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Arjun Nair")
                .email("invalid-email-format")
                .password("password123")
                .role(Role.BUYER)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login should return 200 OK on valid credentials")
    void testLogin_Success() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("arjun@example.com")
                .password("password123")
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("jwt.login.token.test")
                .tokenType("Bearer")
                .id(10L)
                .name("Arjun Nair")
                .email("arjun@example.com")
                .role(Role.BUYER)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt.login.token.test"))
                .andExpect(jsonPath("$.email").value("arjun@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/login should return 400 Bad Request when password is blank")
    void testLogin_BlankPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("arjun@example.com")
                .password("")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
