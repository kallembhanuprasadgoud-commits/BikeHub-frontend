package com.bikehub.repository.specification;

import com.bikehub.entity.Bike;
import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BikeSpecification {

    public static Specification<Bike> filter(
            String search,
            String brand,
            String city,
            BikeCondition condition,
            String fuelType,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minYear,
            Integer maxYear,
            BikeStatus status
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Status filter (default to AVAILABLE for public search if status is not explicitly passed)
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            } else {
                predicates.add(criteriaBuilder.equal(root.get("status"), BikeStatus.AVAILABLE));
            }

            // Keyword text search across brand, model, description
            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate brandMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("brand")), searchPattern);
                Predicate modelMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("model")), searchPattern);
                Predicate descMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), searchPattern);
                predicates.add(criteriaBuilder.or(brandMatch, modelMatch, descMatch));
            }

            // Brand filter
            if (StringUtils.hasText(brand)) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("brand")), brand.trim().toLowerCase()));
            }

            // City filter
            if (StringUtils.hasText(city)) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("city")), city.trim().toLowerCase()));
            }

            // Condition filter
            if (condition != null) {
                predicates.add(criteriaBuilder.equal(root.get("condition"), condition));
            }

            // Fuel type filter
            if (StringUtils.hasText(fuelType)) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("fuelType")), fuelType.trim().toLowerCase()));
            }

            // Price range filter
            if (minPrice != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            // Year range filter
            if (minYear != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("year"), minYear));
            }
            if (maxYear != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("year"), maxYear));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
