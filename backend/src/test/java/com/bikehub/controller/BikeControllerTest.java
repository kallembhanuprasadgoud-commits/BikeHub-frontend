package com.bikehub.controller;

import com.bikehub.dto.response.BikeResponse;
import com.bikehub.dto.response.PageResponse;
import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import com.bikehub.security.CustomUserDetailsService;
import com.bikehub.security.JwtAuthenticationEntryPoint;
import com.bikehub.security.JwtUtils;
import com.bikehub.service.BikeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BikeController.class)
@AutoConfigureMockMvc(addFilters = false)
class BikeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BikeService bikeService;

    @MockBean
    private JwtUtils jwtUtils;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @MockBean
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Test
    @DisplayName("GET /api/bikes should return 200 OK with paginated list")
    void testGetBikes_Success() throws Exception {
        BikeResponse bike = BikeResponse.builder()
                .id(1L)
                .brand("Royal Enfield")
                .model("Classic 350")
                .year(2023)
                .price(new BigDecimal("195000.00"))
                .condition(BikeCondition.EXCELLENT)
                .status(BikeStatus.AVAILABLE)
                .city("Bangalore")
                .build();

        PageResponse<BikeResponse> pageResponse = PageResponse.<BikeResponse>builder()
                .content(Collections.singletonList(bike))
                .pageNo(0)
                .pageSize(10)
                .totalElements(1L)
                .totalPages(1)
                .last(true)
                .build();

        when(bikeService.searchBikes(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/bikes?brand=Royal Enfield")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].brand").value("Royal Enfield"))
                .andExpect(jsonPath("$.content[0].model").value("Classic 350"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/bikes/{id} should return 200 OK with bike specifications")
    void testGetBikeById_Success() throws Exception {
        BikeResponse bike = BikeResponse.builder()
                .id(2L)
                .brand("KTM")
                .model("Duke 390")
                .year(2022)
                .price(new BigDecimal("265000.00"))
                .condition(BikeCondition.EXCELLENT)
                .status(BikeStatus.AVAILABLE)
                .city("Pune")
                .build();

        when(bikeService.getBikeById(eq(2L), any())).thenReturn(bike);

        mockMvc.perform(get("/api/bikes/2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.brand").value("KTM"))
                .andExpect(jsonPath("$.model").value("Duke 390"));
    }

    @Test
    @DisplayName("GET /api/bikes/compare should return 200 OK with comparison list")
    void testCompareBikes_Success() throws Exception {
        BikeResponse bike1 = BikeResponse.builder()
                .id(1L)
                .brand("Royal Enfield")
                .model("Classic 350")
                .price(new BigDecimal("195000.00"))
                .build();

        BikeResponse bike2 = BikeResponse.builder()
                .id(2L)
                .brand("KTM")
                .model("Duke 390")
                .price(new BigDecimal("265000.00"))
                .build();

        when(bikeService.compareBikes(any())).thenReturn(List.of(bike1, bike2));

        mockMvc.perform(get("/api/bikes/compare?ids=1,2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].model").value("Classic 350"))
                .andExpect(jsonPath("$[1].model").value("Duke 390"));
    }
}
