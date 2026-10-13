package com.bikehub.service;

import com.bikehub.dto.response.NotificationResponse;
import com.bikehub.dto.response.UnreadNotificationCountResponse;

import java.util.List;

public interface NotificationService {

    NotificationResponse sendNotification(Long userId, String type, String message);

    List<NotificationResponse> getUserNotifications(Long userId);

    UnreadNotificationCountResponse getUnreadCount(Long userId);

    void markAsRead(Long userId, Long notificationId);

    void markAllAsRead(Long userId);
}
