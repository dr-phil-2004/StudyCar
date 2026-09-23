package com.busbooking.bus_booking_system.dto;

import lombok.Getter;
import org.springframework.stereotype.Component;

@Getter
@Component
public class RecommendationWeights {
    public static final double ARRIVAL_TIME = 0.35;
    public static final double CAPACITY = 0.25;
    public static final double STUDENT_DISTANCE = 0.15;
    public static final double TOTAL_TRAVEL_TIME = 0.25;

    private final double arrivalTimeWeight = ARRIVAL_TIME;
    private final double capacityWeight = CAPACITY;
    private final double studentDistanceWeight = STUDENT_DISTANCE;
    private final double totalTravelTimeWeight = TOTAL_TRAVEL_TIME;
}
