package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.dto.OptimizationActionDTO;
import com.busbooking.bus_booking_system.service.RouteOptimizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/optimization")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OptimizationController {

    private final RouteOptimizationService routeOptimizationService;

    @GetMapping("/suggestions")
    public ResponseEntity<List<OptimizationActionDTO>> getSuggestions() {
        return ResponseEntity.ok(routeOptimizationService.getOptimizationSuggestions());
    }
}
