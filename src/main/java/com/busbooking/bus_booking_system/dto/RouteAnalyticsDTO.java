package com.busbooking.bus_booking_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteAnalyticsDTO {
    private Long routeId;
    private String routeCode;
    private String routeName;
    private long totalPassengersTransported; // Étudiants transportés
    private double averageSaturationRate;    // Taux de saturation moyen (%)
}
