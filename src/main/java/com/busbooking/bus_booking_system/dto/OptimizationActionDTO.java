package com.busbooking.bus_booking_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationActionDTO {
    private String routeCode;
    private String routeName;
    private String actionType;      // ex: "AJOUT_BUS", "REDUCTION_FREQUENCE", "CREATION_ARRET"
    private String justification;   // Texte explicatif chiffré imposé par le sujet
    private double priorityScore;   // Score d'urgence basé sur le taux d'étudiants restés à quai
    private String indicator;
    private double indicatorValue;
    private String indicatorUnit;
}
