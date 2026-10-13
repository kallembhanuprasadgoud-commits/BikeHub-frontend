package com.bikehub.service.impl;

import com.bikehub.dto.request.BikeRequest;
import com.bikehub.dto.response.BikeImageResponse;
import com.bikehub.dto.response.BikeResponse;
import com.bikehub.dto.response.PageResponse;
import com.bikehub.dto.response.SellerSummaryResponse;
import com.bikehub.entity.Bike;
import com.bikehub.entity.BikeImage;
import com.bikehub.entity.SellerProfile;
import com.bikehub.entity.User;
import com.bikehub.enums.ActionType;
import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import com.bikehub.enums.Role;
import com.bikehub.exception.BadRequestException;
import com.bikehub.exception.ResourceNotFoundException;
import com.bikehub.exception.UnauthorizedException;
import com.bikehub.repository.BikeImageRepository;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.repository.specification.BikeSpecification;
import com.bikehub.service.BikeService;
import com.bikehub.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BikeServiceImpl implements BikeService {

    private final BikeRepository bikeRepository;
    private final BikeImageRepository bikeImageRepository;
    private final UserRepository userRepository;
    private final UserActivityService userActivityService;

    @Override
    @Transactional
    public BikeResponse createBike(Long sellerId, BikeRequest request) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + sellerId));

        // Single-account capability: with one email account, any user can sell bikes
        if (seller.getRole() == Role.BUYER) {
            seller.setRole(Role.SELLER);
            userRepository.save(seller);
        }

        Bike bike = Bike.builder()
                .seller(seller)
                .brand(request.getBrand().trim())
                .model(request.getModel().trim())
                .year(request.getYear())
                .kmDriven(request.getKmDriven() != null ? request.getKmDriven() : 0)
                .fuelType(request.getFuelType() != null ? request.getFuelType() : "Petrol")
                .engineCc(request.getEngineCc())
                .condition(request.getCondition())
                .price(request.getPrice())
                .description(request.getDescription())
                .city(request.getCity().trim())
                .status(BikeStatus.AVAILABLE)
                .build();

        Bike savedBike = bikeRepository.save(bike);

        // Process images
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            List<BikeImage> images = new ArrayList<>();
            int primaryIdx = (request.getPrimaryImageIndex() != null && request.getPrimaryImageIndex() < request.getImageUrls().size())
                    ? request.getPrimaryImageIndex() : 0;

            for (int i = 0; i < request.getImageUrls().size(); i++) {
                String url = request.getImageUrls().get(i);
                if (StringUtils.hasText(url)) {
                    images.add(BikeImage.builder()
                            .bike(savedBike)
                            .imageUrl(url.trim())
                            .isPrimary(i == primaryIdx)
                            .build());
                }
            }
            if (!images.isEmpty()) {
                bikeImageRepository.saveAll(images);
                savedBike.setImages(images);
            }
        }

        return mapToBikeResponse(savedBike);
    }

    @Override
    @Transactional
    public BikeResponse updateBike(Long sellerId, Long bikeId, BikeRequest request) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + bikeId));

        if (!bike.getSeller().getId().equals(sellerId)) {
            User requester = userRepository.findById(sellerId).orElse(null);
            if (requester == null || requester.getRole() != Role.ADMIN) {
                throw new UnauthorizedException("You do not have permission to update this listing");
            }
        }

        bike.setBrand(request.getBrand().trim());
        bike.setModel(request.getModel().trim());
        bike.setYear(request.getYear());
        bike.setKmDriven(request.getKmDriven());
        bike.setFuelType(request.getFuelType());
        bike.setEngineCc(request.getEngineCc());
        bike.setCondition(request.getCondition());
        bike.setPrice(request.getPrice());
        bike.setDescription(request.getDescription());
        bike.setCity(request.getCity().trim());

        // Update images if provided
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            bike.getImages().clear();

            int primaryIdx = (request.getPrimaryImageIndex() != null && request.getPrimaryImageIndex() < request.getImageUrls().size())
                    ? request.getPrimaryImageIndex() : 0;

            for (int i = 0; i < request.getImageUrls().size(); i++) {
                String url = request.getImageUrls().get(i);
                if (StringUtils.hasText(url)) {
                    bike.getImages().add(BikeImage.builder()
                            .bike(bike)
                            .imageUrl(url.trim())
                            .isPrimary(i == primaryIdx)
                            .build());
                }
            }
        }

        Bike updated = bikeRepository.save(bike);
        return mapToBikeResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBike(Long requesterId, boolean isAdmin, Long bikeId) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + bikeId));

        if (!isAdmin && !bike.getSeller().getId().equals(requesterId)) {
            throw new UnauthorizedException("You do not have permission to delete this listing");
        }

        bikeRepository.delete(bike);
    }

    @Override
    @Transactional
    public BikeResponse getBikeById(Long id, Long currentUserId) {
        Bike bike = bikeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + id));

        // Log viewing activity for AI recommendations
        if (currentUserId != null) {
            userActivityService.logActivity(currentUserId, id, ActionType.VIEW, null);
        }

        return mapToBikeResponse(bike);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BikeResponse> searchBikes(
            String search,
            String brand,
            String city,
            BikeCondition condition,
            String fuelType,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minYear,
            Integer maxYear,
            BikeStatus status,
            Pageable pageable
    ) {
        Specification<Bike> spec = BikeSpecification.filter(
                search, brand, city, condition, fuelType, minPrice, maxPrice, minYear, maxYear, status
        );

        Page<Bike> bikePage = bikeRepository.findAll(spec, pageable);

        List<BikeResponse> responses = bikePage.getContent().stream()
                .map(this::mapToBikeResponse)
                .collect(Collectors.toList());

        return PageResponse.<BikeResponse>builder()
                .content(responses)
                .pageNo(bikePage.getNumber())
                .pageSize(bikePage.getSize())
                .totalElements(bikePage.getTotalElements())
                .totalPages(bikePage.getTotalPages())
                .last(bikePage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BikeResponse> compareBikes(List<Long> ids) {
        if (ids == null || ids.size() < 2 || ids.size() > 4) {
            throw new BadRequestException("Please select between 2 and 4 bikes to compare");
        }

        List<Bike> bikes = bikeRepository.findByIdIn(ids);
        return bikes.stream().map(this::mapToBikeResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BikeResponse> getSellerBikes(Long sellerId, Pageable pageable) {
        Page<Bike> bikePage = bikeRepository.findBySellerId(sellerId, pageable);

        List<BikeResponse> responses = bikePage.getContent().stream()
                .map(this::mapToBikeResponse)
                .collect(Collectors.toList());

        return PageResponse.<BikeResponse>builder()
                .content(responses)
                .pageNo(bikePage.getNumber())
                .pageSize(bikePage.getSize())
                .totalElements(bikePage.getTotalElements())
                .totalPages(bikePage.getTotalPages())
                .last(bikePage.isLast())
                .build();
    }

    @Override
    @Transactional
    public BikeResponse updateBikeStatus(Long sellerId, Long bikeId, BikeStatus status) {
        Bike bike = bikeRepository.findById(bikeId)
                .orElseThrow(() -> new ResourceNotFoundException("Bike listing not found with id: " + bikeId));

        if (!bike.getSeller().getId().equals(sellerId)) {
            User requester = userRepository.findById(sellerId).orElse(null);
            if (requester == null || requester.getRole() != Role.ADMIN) {
                throw new UnauthorizedException("You do not have permission to modify status for this listing");
            }
        }

        bike.setStatus(status);
        Bike updated = bikeRepository.save(bike);
        return mapToBikeResponse(updated);
    }

    private BikeResponse mapToBikeResponse(Bike bike) {
        // Map seller summary
        User sellerUser = bike.getSeller();
        SellerProfile sp = sellerUser.getSellerProfile();

        SellerSummaryResponse sellerSummary = SellerSummaryResponse.builder()
                .id(sellerUser.getId())
                .name(sellerUser.getName())
                .email(sellerUser.getEmail())
                .phone(sellerUser.getPhone())
                .shopName(sp != null ? sp.getShopName() : null)
                .city(sp != null ? sp.getCity() : null)
                .verificationStatus(sp != null ? sp.getVerificationStatus() : null)
                .build();

        // Map images
        List<BikeImageResponse> imageResponses = new ArrayList<>();
        String primaryUrl = null;

        if (bike.getImages() != null && !bike.getImages().isEmpty()) {
            for (BikeImage img : bike.getImages()) {
                imageResponses.add(BikeImageResponse.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .isPrimary(img.getIsPrimary())
                        .build());
                if (Boolean.TRUE.equals(img.getIsPrimary()) && primaryUrl == null) {
                    primaryUrl = img.getImageUrl();
                }
            }
            if (primaryUrl == null && !imageResponses.isEmpty()) {
                primaryUrl = imageResponses.get(0).getImageUrl();
            }
        }

        return BikeResponse.builder()
                .id(bike.getId())
                .brand(bike.getBrand())
                .model(bike.getModel())
                .year(bike.getYear())
                .kmDriven(bike.getKmDriven())
                .fuelType(bike.getFuelType())
                .engineCc(bike.getEngineCc())
                .condition(bike.getCondition())
                .price(bike.getPrice())
                .description(bike.getDescription())
                .city(bike.getCity())
                .status(bike.getStatus())
                .createdAt(bike.getCreatedAt())
                .seller(sellerSummary)
                .images(imageResponses)
                .primaryImageUrl(primaryUrl)
                .build();
    }
}
