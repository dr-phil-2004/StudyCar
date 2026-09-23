package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.Bus;
import com.busbooking.bus_booking_system.service.BusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buses")
public class BusController {

    private final BusService busService;

    public BusController(BusService busService) {
        this.busService = busService;
    }

    @GetMapping
    public ResponseEntity<List<Bus>> getBuses() {
        return ResponseEntity.ok(busService.findAllBuses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bus> getBusById(@PathVariable Long id) {
        return ResponseEntity.ok(busService.findById(id));
    }
}