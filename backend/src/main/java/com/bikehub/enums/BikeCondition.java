package com.bikehub.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum BikeCondition {
    NEW,
    EXCELLENT,
    GOOD,
    FAIR,
    POOR;

    @JsonCreator
    public static BikeCondition fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return GOOD;
        }
        String normalized = value.trim().toUpperCase();
        if (normalized.contains("LIKE_NEW") || normalized.contains("EXCELLENT")) {
            return EXCELLENT;
        }
        if (normalized.equals("NEW") || normalized.equals("BRAND_NEW")) {
            return NEW;
        }
        if (normalized.contains("GOOD")) {
            return GOOD;
        }
        if (normalized.contains("FAIR")) {
            return FAIR;
        }
        if (normalized.contains("POOR")) {
            return POOR;
        }
        try {
            return BikeCondition.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return GOOD;
        }
    }
}
