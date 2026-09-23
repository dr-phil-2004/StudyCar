package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.dto.RecommendationResponse;
import com.busbooking.bus_booking_system.dto.RecommendationWeights;
import com.busbooking.bus_booking_system.entity.Stop;
import com.busbooking.bus_booking_system.entity.Trip;
import com.busbooking.bus_booking_system.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final TripRepository tripRepository;
    private final RecommendationWeights weights;

    private static final double AVERAGE_BUS_SPEED_KMH = 30.0;

    public List<RecommendationResponse> getRecommendations(double studentLat, double studentLon, String destination) {
        List<Candidate> candidates = new ArrayList<>();
        for (Trip trip : tripRepository.findByStatus(Trip.TripStatus.IN_PROGRESS)) {
            if (trip.getRoute() == null || trip.getBus() == null || trip.getRoute().getStops() == null
                    || trip.getRoute().getStops().isEmpty() || !servesDestination(trip, destination)) {
                continue;
            }

            Integer capacity = trip.getBus().getCapacity();
            int availableSeats = trip.getAvailableSeats();
            if (capacity == null || capacity <= 0 || availableSeats <= 0) {
                continue;
            }

            Stop nearestStop = trip.getRoute().getStops().stream()
                    .filter(stop -> stop.getLatitude() != null && stop.getLongitude() != null)
                    .min(Comparator.comparingDouble(stop ->
                            haversine(studentLat, studentLon, stop.getLatitude(), stop.getLongitude())))
                    .orElse(null);
            if (nearestStop == null) {
                continue;
            }

            double studentDistance = haversine(
                    studentLat, studentLon, nearestStop.getLatitude(), nearestStop.getLongitude());
            double busLatitude = trip.getBus().getLatitude() != null
                    ? trip.getBus().getLatitude() : nearestStop.getLatitude();
            double busLongitude = trip.getBus().getLongitude() != null
                    ? trip.getBus().getLongitude() : nearestStop.getLongitude();
            double busDistance = haversine(
                    busLatitude, busLongitude, nearestStop.getLatitude(), nearestStop.getLongitude());
            double speed = AVERAGE_BUS_SPEED_KMH;
            int etaMinutes = Math.max(1, (int) Math.ceil(busDistance / speed * 60));
            int routeDuration = trip.getRoute().getEstimatedDurationMinutes() == null
                    ? 0 : trip.getRoute().getEstimatedDurationMinutes();

            candidates.add(new Candidate(
                    trip, nearestStop, studentDistance, etaMinutes, availableSeats, etaMinutes + routeDuration));
        }

        if (candidates.isEmpty()) {
            return List.of();
        }

        double minEta = candidates.stream().mapToDouble(Candidate::etaMinutes).min().orElse(0);
        double maxEta = candidates.stream().mapToDouble(Candidate::etaMinutes).max().orElse(0);
        double minSeats = candidates.stream().mapToDouble(Candidate::availableSeats).min().orElse(0);
        double maxSeats = candidates.stream().mapToDouble(Candidate::availableSeats).max().orElse(0);
        double minDistance = candidates.stream().mapToDouble(Candidate::studentDistance).min().orElse(0);
        double maxDistance = candidates.stream().mapToDouble(Candidate::studentDistance).max().orElse(0);
        double minTravel = candidates.stream().mapToDouble(Candidate::totalTravelTime).min().orElse(0);
        double maxTravel = candidates.stream().mapToDouble(Candidate::totalTravelTime).max().orElse(0);

        return candidates.stream()
                .map(candidate -> toResponse(candidate, minEta, maxEta, minSeats, maxSeats,
                        minDistance, maxDistance, minTravel, maxTravel))
                .sorted(Comparator.comparingDouble(RecommendationResponse::getScore).reversed())
                .toList();
    }

    private RecommendationResponse toResponse(
            Candidate candidate, double minEta, double maxEta, double minSeats, double maxSeats,
            double minDistance, double maxDistance, double minTravel, double maxTravel) {
        double arrivalScore = inverseNormalize(candidate.etaMinutes(), minEta, maxEta);
        double capacityScore = normalize(candidate.availableSeats(), minSeats, maxSeats);
        double distanceScore = inverseNormalize(candidate.studentDistance(), minDistance, maxDistance);
        double travelScore = inverseNormalize(candidate.totalTravelTime(), minTravel, maxTravel);
        double score = 100 * (
                arrivalScore * weights.getArrivalTimeWeight()
                        + capacityScore * weights.getCapacityWeight()
                        + distanceScore * weights.getStudentDistanceWeight()
                        + travelScore * weights.getTotalTravelTimeWeight());

        return RecommendationResponse.builder()
                .busCode(candidate.trip().getBus().getCode())
                .tripId(candidate.trip().getId())
                .score(Math.round(score * 100) / 100.0)
                .etaMinutes(candidate.etaMinutes())
                .availableSeats(candidate.availableSeats())
                .totalTravelTime(candidate.totalTravelTime())
                .studentDistanceKm(Math.round(candidate.studentDistance() * 100) / 100.0)
                .recommendedStopName(candidate.stop().getName())
                .build();
    }

    private boolean servesDestination(Trip trip, String destination) {
        if (destination == null || destination.isBlank()) {
            return false;
        }
        String requested = destination.trim();
        String routeDestination = trip.getRoute().getDestination();
        return requested.equalsIgnoreCase(routeDestination)
                || trip.getRoute().getStops().stream()
                .anyMatch(stop -> stop.getName() != null && requested.equalsIgnoreCase(stop.getName()));
    }

    private double normalize(double value, double min, double max) {
        return max == min ? 1.0 : (value - min) / (max - min);
    }

    private double inverseNormalize(double value, double min, double max) {
        return 1.0 - normalize(value, min, max);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private record Candidate(
            Trip trip, Stop stop, double studentDistance, int etaMinutes,
            int availableSeats, int totalTravelTime) {
    }
}
