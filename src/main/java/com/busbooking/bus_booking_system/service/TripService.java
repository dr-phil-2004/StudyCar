package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.entity.Trip;
import com.busbooking.bus_booking_system.repository.TripRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TripService {

    private final TripRepository tripRepository;

    public TripService(TripRepository tripRepository) {
        this.tripRepository = tripRepository;
    }

    public List<Trip> findByRoute(Long routeId) {
        return tripRepository.findByRouteId(routeId);
    }

    public Trip findById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found"));
    }

    public List<Trip> findAll() {
        return tripRepository.findAll();
    }
}