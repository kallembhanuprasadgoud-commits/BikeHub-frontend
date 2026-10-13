package com.bikehub.entity;

import com.bikehub.enums.BikeCondition;
import com.bikehub.enums.BikeStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bikes", indexes = {
        @Index(name = "idx_bikes_brand", columnList = "brand"),
        @Index(name = "idx_bikes_price", columnList = "price"),
        @Index(name = "idx_bikes_city", columnList = "city"),
        @Index(name = "idx_bikes_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(nullable = false, length = 80)
    private String brand;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "km_driven")
    @Builder.Default
    private Integer kmDriven = 0;

    @Column(name = "fuel_type", length = 30)
    private String fuelType;

    @Column(name = "engine_cc")
    private Integer engineCc;

    @Enumerated(EnumType.STRING)
    @Column(name = "bike_condition", nullable = false, length = 20)
    @Builder.Default
    private BikeCondition condition = BikeCondition.GOOD;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String city;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BikeStatus status = BikeStatus.AVAILABLE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "bike", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BikeImage> images = new ArrayList<>();
}
