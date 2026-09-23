package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.dto.RouteAnalyticsDTO;
import com.busbooking.bus_booking_system.dto.StopAnalyticsDTO;
import com.busbooking.bus_booking_system.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/stops/{stopId}")
    public ResponseEntity<StopAnalyticsDTO> getStopAnalytics(@PathVariable Long stopId) {
        return ResponseEntity.ok(analyticsService.getStopAnalytics(stopId));
    }

    @GetMapping("/top-routes")
    public ResponseEntity<List<RouteAnalyticsDTO>> getTop5Routes() {
        return ResponseEntity.ok(analyticsService.getTop5Routes());
    }
}
