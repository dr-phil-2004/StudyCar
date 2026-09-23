package com.busbooking.bus_booking_system.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RecommendationResponse {
    private String busCode;
    private Long tripId;
    private double score;
    private int etaMinutes;
    private int availableSeats;
    private int totalTravelTime;
    private double studentDistanceKm;
    private String recommendedStopName;
}
