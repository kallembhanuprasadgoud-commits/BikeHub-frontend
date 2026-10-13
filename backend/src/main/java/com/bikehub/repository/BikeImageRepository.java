package com.bikehub.repository;

import com.bikehub.entity.BikeImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BikeImageRepository extends JpaRepository<BikeImage, Long> {

    List<BikeImage> findByBikeId(Long bikeId);

    void deleteByBikeId(Long bikeId);
}
