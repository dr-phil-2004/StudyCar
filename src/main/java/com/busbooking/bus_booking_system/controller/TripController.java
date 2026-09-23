package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.Trip;
import com.busbooking.bus_booking_system.service.TripService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping
    public ResponseEntity<List<Trip>> getTrips(@RequestParam(required = false) Long routeId) {
        if (routeId != null) return ResponseEntity.ok(tripService.findByRoute(routeId));
        return ResponseEntity.ok(tripService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.findById(id));
    }
}