package com.bikehub.repository;

import com.bikehub.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatRoomIdOrderBySentAtAsc(Long roomId);

    Optional<ChatMessage> findFirstByChatRoomIdOrderBySentAtDesc(Long roomId);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.chatRoom.id = :roomId AND m.sender.id <> :userId AND m.isRead = false")
    long countUnreadMessages(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.chatRoom.id = :roomId AND m.sender.id <> :readerId AND m.isRead = false")
    void markRoomMessagesAsRead(@Param("roomId") Long roomId, @Param("readerId") Long readerId);
}
