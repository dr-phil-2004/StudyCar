package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.Passenger;
import com.busbooking.bus_booking_system.service.PassengerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/passengers")
public class PassengerController {

    private final PassengerService passengerService;

    public PassengerController(PassengerService passengerService) {
        this.passengerService = passengerService;
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Passenger>> getPassengersByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(passengerService.findByBookingId(bookingId));
    }
}