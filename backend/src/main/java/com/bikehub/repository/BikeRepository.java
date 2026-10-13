package com.bikehub.repository;

import com.bikehub.entity.Bike;
import com.bikehub.enums.BikeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BikeRepository extends JpaRepository<Bike, Long>, JpaSpecificationExecutor<Bike> {

    Page<Bike> findBySellerId(Long sellerId, Pageable pageable);

    List<Bike> findByIdIn(List<Long> ids);

    long countBySellerId(Long sellerId);

    long countByStatus(BikeStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT b.brand, COUNT(b), AVG(b.price) FROM Bike b GROUP BY b.brand ORDER BY COUNT(b) DESC")
    List<Object[]> findTopBrandsWithStats();

    @org.springframework.data.jpa.repository.Query("SELECT b.city, COUNT(b) FROM Bike b WHERE b.city IS NOT NULL AND b.city <> '' GROUP BY b.city ORDER BY COUNT(b) DESC")
    List<Object[]> findTopCities();
}
