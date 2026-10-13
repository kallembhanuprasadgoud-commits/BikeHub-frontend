package com.bikehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bike_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BikeImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bike_id", nullable = false)
    private Bike bike;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;
}
