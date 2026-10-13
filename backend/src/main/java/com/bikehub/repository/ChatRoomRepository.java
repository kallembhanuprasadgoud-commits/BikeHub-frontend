package com.bikehub.repository;

import com.bikehub.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByBuyerIdAndSellerIdAndBikeId(Long buyerId, Long sellerId, Long bikeId);

    @Query("SELECT cr FROM ChatRoom cr WHERE cr.buyer.id = :userId OR cr.seller.id = :userId ORDER BY cr.id DESC")
    List<ChatRoom> findUserChatRooms(@Param("userId") Long userId);
}
