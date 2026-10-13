package com.bikehub.service;

import com.bikehub.dto.request.BikeRequest;
import com.bikehub.dto.response.BikeResponse;
import com.bikehub.dto.response.PageResponse;
import com.bikehub.entity.Bike;
import com.bikehub.entity.User;
import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import com.bikehub.enums.Role;
import com.bikehub.enums.UserStatus;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.BikeImageRepository;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.service.impl.BikeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BikeServiceTest {

    @Mock
    private BikeRepository bikeRepository;

    @Mock
    private BikeImageRepository bikeImageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserActivityService userActivityService;

    @InjectMocks
    private BikeServiceImpl bikeService;

    private User sampleSeller;
    private User sampleBuyer;
    private Bike sampleBike;

    @BeforeEach
    void setUp() {
        sampleSeller = User.builder()
                .id(2L)
                .name("Seller Rajesh")
                .email("seller@test.com")
                .role(Role.SELLER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleBuyer = User.builder()
                .id(4L)
                .name("Buyer Amit")
                .email("buyer@test.com")
                .role(Role.BUYER)
                .status(UserStatus.ACTIVE)
                .build();

        sampleBike = Bike.builder()
                .id(1L)
                .seller(sampleSeller)
                .brand("Royal Enfield")
                .model("Classic 350")
                .year(2022)
                .kmDriven(12000)
                .fuelType("Petrol")
                .engineCc(349)
                .condition(BikeCondition.EXCELLENT)
                .price(new BigDecimal("165000.00"))
                .description("Clean single owner")
                .city("Pune")
                .status(BikeStatus.AVAILABLE)
                .createdAt(LocalDateTime.now())
                .images(new ArrayList<>())
                .build();
    }

    @Test
    void createBike_WhenValidSeller_ReturnsBikeResponse() {
        BikeRequest request = BikeRequest.builder()
                .brand("Royal Enfield")
                .model("Classic 350")
                .year(2022)
                .kmDriven(12000)
                .fuelType("Petrol")
                .engineCc(349)
                .condition(BikeCondition.EXCELLENT)
                .price(new BigDecimal("165000.00"))
                .city("Pune")
                .imageUrls(List.of("https://example.com/bike.jpg"))
                .primaryImageIndex(0)
                .build();

        when(userRepository.findById(2L)).thenReturn(Optional.of(sampleSeller));
        when(bikeRepository.save(any(Bike.class))).thenReturn(sampleBike);

        BikeResponse response = bikeService.createBike(2L, request);

        assertNotNull(response);
        assertEquals("Royal Enfield", response.getBrand());
        assertEquals("Classic 350", response.getModel());
        verify(bikeRepository, times(1)).save(any(Bike.class));
    }

    @Test
    void createBike_WhenUserIsBuyer_SucceedsAndPromotesUser() {
        BikeRequest request = BikeRequest.builder()
                .brand("Yamaha")
                .model("R15")
                .year(2023)
                .price(new BigDecimal("150000.00"))
                .condition(BikeCondition.EXCELLENT)
                .city("Pune")
                .build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(sampleBuyer));
        when(bikeRepository.save(any(Bike.class))).thenReturn(sampleBike);

        BikeResponse response = bikeService.createBike(4L, request);

        assertNotNull(response);
        assertEquals(Role.SELLER, sampleBuyer.getRole());
        verify(bikeRepository, times(1)).save(any(Bike.class));
    }

    @Test
    void getBikeById_WhenFound_ReturnsBikeResponse() {
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));

        BikeResponse response = bikeService.getBikeById(1L, 4L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Royal Enfield", response.getBrand());
        verify(userActivityService, times(1)).logActivity(eq(4L), eq(1L), any(), any());
    }

    @Test
    void getBikeById_WhenNotFound_ThrowsResourceNotFoundException() {
        when(bikeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> bikeService.getBikeById(99L, null));
    }

    @Test
    void searchBikes_ReturnsPagedBikeResponses() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Bike> bikePage = new PageImpl<>(List.of(sampleBike), pageable, 1);

        when(bikeRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(bikePage);

        PageResponse<BikeResponse> result = bikeService.searchBikes(
                "Royal", "Royal Enfield", "Pune", BikeCondition.EXCELLENT, "Petrol",
                BigDecimal.ZERO, new BigDecimal("200000"), 2020, 2024, BikeStatus.AVAILABLE, pageable
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals("Royal Enfield", result.getContent().get(0).getBrand());
    }

    @Test
    void compareBikes_When2ValidIds_ReturnsList() {
        Bike secondBike = Bike.builder()
                .id(2L)
                .seller(sampleSeller)
                .brand("Yamaha")
                .model("R15 V4")
                .year(2023)
                .price(new BigDecimal("152000.00"))
                .condition(BikeCondition.EXCELLENT)
                .city("Bangalore")
                .status(BikeStatus.AVAILABLE)
                .images(new ArrayList<>())
                .build();

        when(bikeRepository.findByIdIn(List.of(1L, 2L))).thenReturn(Arrays.asList(sampleBike, secondBike));

        List<BikeResponse> result = bikeService.compareBikes(List.of(1L, 2L));

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Royal Enfield", result.get(0).getBrand());
        assertEquals("Yamaha", result.get(1).getBrand());
    }

    @Test
    void compareBikes_WhenLessThan2Ids_ThrowsBadRequestException() {
        assertThrows(BadRequestException.class, () -> bikeService.compareBikes(List.of(1L)));
    }

    @Test
    void deleteBike_WhenNotOwnerAndNotAdmin_ThrowsUnauthorizedException() {
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));

        // Seller 99 is not owner of sampleBike (owner is 2)
        assertThrows(UnauthorizedException.class, () -> bikeService.deleteBike(99L, false, 1L));
        verify(bikeRepository, never()).delete(any(Bike.class));
    }

    @Test
    void deleteBike_WhenOwner_Success() {
        when(bikeRepository.findById(1L)).thenReturn(Optional.of(sampleBike));

        bikeService.deleteBike(2L, false, 1L);

        verify(bikeRepository, times(1)).delete(eq(sampleBike));
    }
}
