package com.bikehub.repository;

import com.bikehub.entity.Order;
import com.bikehub.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByBuyerId(Long buyerId, Pageable pageable);

    Page<Order> findByBikeSellerId(Long sellerId, Pageable pageable);

    Optional<Order> findByIdAndBuyerId(Long id, Long buyerId);

    boolean existsByBikeIdAndStatusIn(Long bikeId, List<OrderStatus> statuses);

    List<Order> findByBikeIdAndStatusIn(Long bikeId, List<OrderStatus> statuses);

    Optional<Order> findFirstByBikeIdAndBuyerIdAndStatus(Long bikeId, Long buyerId, OrderStatus status);

    long countByStatus(OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM Order o WHERE o.status IN ('PAID', 'SHIPPED', 'DELIVERED')")
    BigDecimal sumTotalRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.bike.seller.id = :sellerId AND o.status IN ('PAID', 'SHIPPED', 'DELIVERED')")
    long countCompletedOrdersBySeller(@Param("sellerId") Long sellerId);

    List<Order> findTop5ByOrderByCreatedAtDesc();
}
