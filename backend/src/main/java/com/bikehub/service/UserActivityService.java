package com.bikehub.service;

import com.bikehub.enums.ActionType;

public interface UserActivityService {

    void logActivity(Long userId, Long bikeId, ActionType actionType, String searchTerm);
}
