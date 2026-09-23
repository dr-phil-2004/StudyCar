package com.busbooking.bus_booking_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StopAnalyticsDTO {
    private Long stopId;
    private String stopName;
    private long totalBoardings;    // Personnes montées
    private long totalAlightings;   // Personnes descendues
    private long currentWaiting;    // Personnes actuellement en attente
    private double averageWaitingTimeMinutes; // Temps moyen d'attente
}
