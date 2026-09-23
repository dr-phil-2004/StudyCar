package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.Route;
import com.busbooking.bus_booking_system.repository.RouteRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteRepository routeRepository;

    public RouteController(RouteRepository routeRepository) {
        this.routeRepository = routeRepository;
    }

    @GetMapping
    public ResponseEntity<List<Route>> getRoutes() {
        return ResponseEntity.ok(routeRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Route> getRoute(@PathVariable Long id) {
        return routeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}