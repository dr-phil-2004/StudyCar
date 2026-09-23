package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.dto.RecommendationResponse;
import com.busbooking.bus_booking_system.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) String destination) {
        if (latitude == null || longitude == null || destination == null || destination.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        List<RecommendationResponse> results = recommendationService.getRecommendations(latitude, longitude, destination);
        return ResponseEntity.ok(results);
    }
}
