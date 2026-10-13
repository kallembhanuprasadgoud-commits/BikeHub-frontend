package com.bikehub.service.impl;

import com.bikehub.entity.Bike;
import com.bikehub.entity.User;
import com.bikehub.entity.UserActivity;
import com.bikehub.enums.ActionType;
import com.bikehub.repository.BikeRepository;
import com.bikehub.repository.UserActivityRepository;
import com.bikehub.repository.UserRepository;
import com.bikehub.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserActivityServiceImpl implements UserActivityService {

    private final UserActivityRepository userActivityRepository;
    private final UserRepository userRepository;
    private final BikeRepository bikeRepository;

    @Override
    public void logActivity(Long userId, Long bikeId, ActionType actionType, String searchTerm) {
        if (userId == null) {
            return; // Anonymous views do not track personal recommendation profile
        }

        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return;
            }

            Bike bike = null;
            if (bikeId != null) {
                bike = bikeRepository.findById(bikeId).orElse(null);
            }

            UserActivity activity = UserActivity.builder()
                    .user(user)
                    .bike(bike)
                    .actionType(actionType)
                    .searchTerm(searchTerm)
                    .build();

            userActivityRepository.save(activity);
        } catch (Exception e) {
            log.warn("Failed to log user activity for recommendation: {}", e.getMessage());
        }
    }
}
