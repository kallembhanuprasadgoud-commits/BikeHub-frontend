package com.bikehub.controller;

import com.bikehub.dto.response.ApiResponse;
import com.bikehub.dto.response.NotificationResponse;
import com.bikehub.dto.response.UnreadNotificationCountResponse;
import com.bikehub.security.CustomUserDetails;
import com.bikehub.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Endpoints for retrieving and managing user alerts and notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user notifications", description = "Returns chronological list of notifications for the authenticated user")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<NotificationResponse> list = notificationService.getUserNotifications(userDetails.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get unread notifications count", description = "Returns total count of unread notifications for badge rendering")
    public ResponseEntity<UnreadNotificationCountResponse> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UnreadNotificationCountResponse response = notificationService.getUnreadCount(userDetails.getId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark single notification as read", description = "Flags a specific notification as viewed")
    public ResponseEntity<ApiResponse> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        notificationService.markAsRead(userDetails.getId(), id);
        return ResponseEntity.ok(new ApiResponse(true, "Notification marked as read"));
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark all notifications as read", description = "Flags all user notifications as viewed")
    public ResponseEntity<ApiResponse> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        notificationService.markAllAsRead(userDetails.getId());
        return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read"));
    }
}
