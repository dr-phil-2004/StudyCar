package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.dto.OptimizationActionDTO;
import com.busbooking.bus_booking_system.dto.RouteAnalyticsDTO;
import com.busbooking.bus_booking_system.dto.StopAnalyticsDTO;
import com.busbooking.bus_booking_system.entity.Route;
import com.busbooking.bus_booking_system.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RouteOptimizationService {

    private final AnalyticsService analyticsService;
    private final RouteRepository routeRepository;

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
            if (route.getStops() != null) {
                for (var stop : route.getStops()) {
                    StopAnalyticsDTO stopAnalytics = analyticsService.getStopAnalytics(stop.getId());
                    totalWaitingOnRoute += stopAnalytics.getCurrentWaiting();
                    if (stopAnalytics.getAverageWaitingTimeMinutes() > maxWaitTime) {
                        maxWaitTime = stopAnalytics.getAverageWaitingTimeMinutes();
                    }
                }
            }

            // Règle A : Ligne saturée (Taux > 80% OU attente moyenne élevée) -> Ajouter des véhicules
            if (analytics.getAverageSaturationRate() >= SATURATION_THRESHOLD || totalWaitingOnRoute > 40) {
                suggestions.add(OptimizationActionDTO.builder()
                        .routeCode(route.getCode())
                        .routeName(route.getName())
                        .actionType("AJOUT_BUS")
                        .justification(String.format(
                                "Taux de saturation critique de %.1f%% avec %d étudiants actuellement bloqués aux arrêts. Temps d'attente max constaté de %.1f min.",
                                analytics.getAverageSaturationRate(), totalWaitingOnRoute, maxWaitTime))
                        .priorityScore(analytics.getAverageSaturationRate() + (totalWaitingOnRoute * 0.5))
                        .build());
            }

            // Règle B : Ligne en sous-charge chronique -> Réduire les fréquences pour économiser la flotte
            else if (analytics.getAverageSaturationRate() <= UNDERLOAD_THRESHOLD && analytics.getTotalPassengersTransported() > 0) {
                suggestions.add(OptimizationActionDTO.builder()
                        .routeCode(route.getCode())
                        .routeName(route.getName())
                        .actionType("REDUCTION_FREQUENCE")
                        .justification(String.format(
                                "Ligne sous-utilisée avec un taux de remplissage moyen de %.1f%%. Optimisation possible des coûts opérationnels.",
                                analytics.getAverageSaturationRate()))
                        .priorityScore(50.0 - analytics.getAverageSaturationRate())
                        .build());
            }
        }

        // Trier par priorité décroissante (les urgences d'abord)
        return suggestions.stream()
                .sorted(Comparator.comparingDouble(OptimizationActionDTO::getPriorityScore).reversed())
                .collect(Collectors.toList());
    }
}
