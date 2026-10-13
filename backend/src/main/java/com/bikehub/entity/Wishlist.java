package com.bikehub.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wishlist", uniqueConstraints = {
        @UniqueConstraint(name = "uq_wishlist", columnNames = {"user_id", "bike_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wishlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bike_id", nullable = false)
    private Bike bike;
}
