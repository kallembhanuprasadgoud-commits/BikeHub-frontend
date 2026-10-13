package com.bikehub.repository;

import com.bikehub.entity.SellerProfile;
import com.bikehub.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {

    Optional<SellerProfile> findByUserId(Long userId);

    long countByVerificationStatus(VerificationStatus status);

    Page<SellerProfile> findByVerificationStatus(VerificationStatus status, Pageable pageable);
}
