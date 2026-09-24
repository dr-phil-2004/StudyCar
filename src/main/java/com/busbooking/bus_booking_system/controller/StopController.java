package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.Stop;
import com.busbooking.bus_booking_system.repository.StopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stops")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StopController {

    private final StopRepository stopRepository;

    @GetMapping
    public ResponseEntity<List<Stop>> getAllStops() {
        return ResponseEntity.ok(stopRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Stop> getStopById(@PathVariable Long id) {
        return stopRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/route/{routeId}")
    public ResponseEntity<List<Stop>> getStopsByRoute(@PathVariable Long routeId) {
        return ResponseEntity.ok(stopRepository.findByRouteIdOrderBySequenceOrderAsc(routeId));
    }
}