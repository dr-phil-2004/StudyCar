package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.dto.RouteAnalyticsDTO;
import com.busbooking.bus_booking_system.dto.StopAnalyticsDTO;
import com.busbooking.bus_booking_system.entity.PassengerEvent;
import com.busbooking.bus_booking_system.entity.Route;
import com.busbooking.bus_booking_system.entity.Stop;
import com.busbooking.bus_booking_system.entity.Trip;
import com.busbooking.bus_booking_system.repository.PassengerEventRepository;
import com.busbooking.bus_booking_system.repository.RouteRepository;
import com.busbooking.bus_booking_system.repository.StopRepository;
import com.busbooking.bus_booking_system.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final PassengerEventRepository passengerEventRepository;
    private final RouteRepository routeRepository;
    private final StopRepository stopRepository;
    private final TripRepository tripRepository;

    /**
     * Cas d'usage 2 : Analyse d'un arrêt spécifique (Montées, Descentes, Attentes, Temps moyen)
     */
    public StopAnalyticsDTO getStopAnalytics(Long stopId) {
        Stop stop = stopRepository.findById(stopId)
                .orElseThrow(() -> new RuntimeException("Arrêt introuvable"));

        List<PassengerEvent> events = passengerEventRepository.findAll().stream()
                .filter(e -> e.getStop() != null && e.getStop().getId().equals(stopId))
                .collect(Collectors.toList());

        long boardings = events.stream()
                .filter(e -> e.getType() == PassengerEvent.EventType.BOARDING)
                .mapToLong(PassengerEvent::getPassengerCount)
                .sum();

        long alightings = events.stream()
                .filter(e -> e.getType() == PassengerEvent.EventType.ALIGHTING)
                .mapToLong(PassengerEvent::getPassengerCount)
                .sum();

        long waiting = events.stream()
                .filter(e -> e.getType() == PassengerEvent.EventType.WAITING)
                .mapToLong(PassengerEvent::getPassengerCount)
                .sum();

        // Simulation d'un calcul de temps moyen d'attente (en minutes) basé sur la saturation locale
        // Plus il y a d'étudiants en attente par rapport aux flux historiques, plus l'attente augmente.
        double avgWaitingTime = 5.0; // Seuil de base fluide
        if (waiting > 0) {
            avgWaitingTime += Math.min(25.0, (double) waiting * 0.4);
        }

        return StopAnalyticsDTO.builder()
                .stopId(stop.getId())
                .stopName(stop.getName())
                .totalBoardings(boardings)
                .totalAlightings(alightings)
                .currentWaiting(Math.max(0, waiting - boardings)) // Reste à quai réaliste
                .averageWaitingTimeMinutes(Math.round(avgWaitingTime * 10.0) / 10.0)
                .build();
    }

    /**
     * Cas d'usage 3 : Top 5 des itinéraires les plus fréquentés avec taux de saturation moyen
     */
    public List<RouteAnalyticsDTO> getTop5Routes() {
        List<Route> allRoutes = routeRepository.findAll();
        List<RouteAnalyticsDTO> analyticsList = new ArrayList<>();

        for (Route route : allRoutes) {
            // Récupérer tous les trajets associés à cet itinéraire
            List<Trip> trips = tripRepository.findAll().stream()
                    .filter(t -> t.getRoute() != null && t.getRoute().getId().equals(route.getId()))
                    .collect(Collectors.toList());

            if (trips.isEmpty()) continue;

            // 1. Calculer le cumul des passagers montés (BOARDING) sur tous les trajets de cette ligne
            long totalPassengers = passengerEventRepository.findAll().stream()
                    .filter(e -> e.getTrip() != null && e.getTrip().getRoute() != null && e.getTrip().getRoute().getId().equals(route.getId()))
                    .filter(e -> e.getType() == PassengerEvent.EventType.BOARDING)
                    .mapToLong(PassengerEvent::getPassengerCount)
                    .sum();

            // S'il n'y a pas encore d'événements, on prend une approximation par rapport à la charge des trips actifs
            if (totalPassengers == 0) {
                totalPassengers = trips.stream().mapToLong(Trip::getCurrentPassengers).sum();
            }

            // 2. Calculer le taux moyen de saturation/remplissage
            double totalSaturationRate = trips.stream()
                    .mapToDouble(Trip::getOccupancyRate)
                    .sum();
            double avgSaturation = totalSaturationRate / trips.size();

            analyticsList.add(RouteAnalyticsDTO.builder()
                    .routeId(route.getId())
                    .routeCode(route.getCode())
                    .routeName(route.getName())
                    .totalPassengersTransported(totalPassengers)
                    .averageSaturationRate(Math.round(avgSaturation * 10.0) / 10.0)
                    .build());
        }

        // Trier par nombre total d'étudiants transportés décroissant et limiter aux 5 premiers
        return analyticsList.stream()
                .sorted(Comparator.comparingLong(RouteAnalyticsDTO::getTotalPassengersTransported).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }
}
