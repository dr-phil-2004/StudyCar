package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.dto.OptimizationActionDTO;
import com.busbooking.bus_booking_system.dto.RouteAnalyticsDTO;
import com.busbooking.bus_booking_system.dto.StopAnalyticsDTO;
import com.busbooking.bus_booking_system.entity.Route;
import com.busbooking.bus_booking_system.entity.PassengerEvent;
import com.busbooking.bus_booking_system.repository.PassengerEventRepository;
import com.busbooking.bus_booking_system.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RouteOptimizationService {

    private final AnalyticsService analyticsService;
    private final RouteRepository routeRepository;
    private final PassengerEventRepository passengerEventRepository;

    public List<OptimizationActionDTO> getOptimizationSuggestions() {
        List<Route> routes = routeRepository.findAll();
        List<OptimizationActionDTO> suggestions = new ArrayList<>();

        // Seuil critique défini pour déclencher une alerte
        double SATURATION_THRESHOLD = 80.0;
        double UNDERLOAD_THRESHOLD = 30.0;

        for (Route route : routes) {
            // 1. Récupérer l'état de la ligne via le service d'analytics
            List<RouteAnalyticsDTO> routeData = analyticsService.getTop5Routes().stream()
                    .filter(r -> r.getRouteId().equals(route.getId()))
                    .collect(Collectors.toList());

            if (routeData.isEmpty()) continue;
            RouteAnalyticsDTO analytics = routeData.get(0);

            // 2. Analyser les arrêts de cette ligne pour détecter la congestion locale
            long totalWaitingOnRoute = 0;
            double maxWaitTime = 0;
            String congestionStop = null;
            if (route.getStops() != null) {
                for (var stop : route.getStops()) {
                    StopAnalyticsDTO stopAnalytics = analyticsService.getStopAnalytics(stop.getId());
                    totalWaitingOnRoute += stopAnalytics.getCurrentWaiting();
                    if (stopAnalytics.getAverageWaitingTimeMinutes() > maxWaitTime) {
                        maxWaitTime = stopAnalytics.getAverageWaitingTimeMinutes();
                        congestionStop = stop.getName();
                    }
                }
            }
            String peakHour = passengerEventRepository.findAll().stream()
                    .filter(event -> event.getTrip() != null
                            && event.getTrip().getRoute() != null
                            && route.getId().equals(event.getTrip().getRoute().getId())
                            && event.getTimestamp() != null)
                    .collect(Collectors.groupingBy(event -> event.getTimestamp().getHour(),
                            Collectors.summingInt(event -> event.getPassengerCount() == null
                                    ? 0 : event.getPassengerCount())))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(entry -> String.format("%02d:00-%02d:00", entry.getKey(), entry.getKey() + 1))
                    .orElse("non disponible");

            // Règle A : Ligne saturée (Taux > 80% OU attente moyenne élevée) -> Ajouter des véhicules
            if (analytics.getAverageSaturationRate() >= SATURATION_THRESHOLD || totalWaitingOnRoute > 40) {
                suggestions.add(OptimizationActionDTO.builder()
                        .routeCode(route.getCode())
                        .routeName(route.getName())
                        .actionType("AJOUT_BUS")
                        .justification(String.format(
                                "Ajouter un bus : saturation %.1f%%, %d étudiants en attente, congestion à %s (%.1f min), heure de pointe %s.",
                                analytics.getAverageSaturationRate(), totalWaitingOnRoute,
                                congestionStop == null ? "non identifiée" : congestionStop, maxWaitTime, peakHour))
                        .priorityScore(analytics.getAverageSaturationRate() + (totalWaitingOnRoute * 0.5))
                        .indicator("Saturation / attente")
                        .indicatorValue(Math.max(analytics.getAverageSaturationRate(), totalWaitingOnRoute))
                        .indicatorUnit("% / étudiants")
                        .build());
            }

            // Règle B : Ligne en sous-charge chronique -> Réduire les fréquences pour économiser la flotte
            else if (analytics.getAverageSaturationRate() <= UNDERLOAD_THRESHOLD && analytics.getTotalPassengersTransported() > 0) {
                suggestions.add(OptimizationActionDTO.builder()
                        .routeCode(route.getCode())
                        .routeName(route.getName())
                        .actionType("REDUCTION_FREQUENCE")
                        .justification(String.format(
                                "Fusionner ou réduire la ligne : saturation %.1f%%, %d passagers transportés, heure de pointe observée %s.",
                                analytics.getAverageSaturationRate(), analytics.getTotalPassengersTransported(), peakHour))
                        .priorityScore(50.0 - analytics.getAverageSaturationRate())
                        .indicator("Saturation moyenne")
                        .indicatorValue(analytics.getAverageSaturationRate())
                        .indicatorUnit("%")
                        .build());
            }

            if (totalWaitingOnRoute > 20 && maxWaitTime >= 10) {
                suggestions.add(OptimizationActionDTO.builder()
                        .routeCode(route.getCode())
                        .routeName(route.getName())
                        .actionType("CREATION_ARRET")
                        .justification(String.format(
                                "Créer ou repositionner un arrêt près de %s : %d étudiants en attente sur la ligne et attente maximale de %.1f min.",
                                congestionStop == null ? "la zone congestionnée" : congestionStop,
                                totalWaitingOnRoute, maxWaitTime))
                        .priorityScore(totalWaitingOnRoute + maxWaitTime)
                        .indicator("Attente maximale")
                        .indicatorValue(maxWaitTime)
                        .indicatorUnit("minutes")
                        .build());
            }
        }

        // Trier par priorité décroissante (les urgences d'abord)
        return suggestions.stream()
                .sorted(Comparator.comparingDouble(OptimizationActionDTO::getPriorityScore).reversed())
                .collect(Collectors.toList());
    }
}
