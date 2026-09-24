package com.busbooking.bus_booking_system.dto;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class RecommendationWeights {
    private final double arrivalTimeWeight;
    private final double capacityWeight;
    private final double studentDistanceWeight;
    private final double totalTravelTimeWeight;

    public RecommendationWeights(
            @Value("${recommendations.weights.arrival-time:${RECOMMENDATION_WEIGHT_ARRIVAL_TIME:0.35}}")
            double arrivalTimeWeight,
            @Value("${recommendations.weights.capacity:${RECOMMENDATION_WEIGHT_CAPACITY:0.25}}")
            double capacityWeight,
            @Value("${recommendations.weights.student-distance:${RECOMMENDATION_WEIGHT_STUDENT_DISTANCE:0.15}}")
            double studentDistanceWeight,
            @Value("${recommendations.weights.total-travel-time:${RECOMMENDATION_WEIGHT_TOTAL_TRAVEL_TIME:0.25}}")
            double totalTravelTimeWeight) {
        double total = arrivalTimeWeight + capacityWeight + studentDistanceWeight + totalTravelTimeWeight;
        if (total <= 0) {
            throw new IllegalArgumentException("Recommendation weights must have a positive total");
        }
        this.arrivalTimeWeight = arrivalTimeWeight / total;
        this.capacityWeight = capacityWeight / total;
        this.studentDistanceWeight = studentDistanceWeight / total;
        this.totalTravelTimeWeight = totalTravelTimeWeight / total;
    }
}
