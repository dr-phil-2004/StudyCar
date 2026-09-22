package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.Booking;
import com.busbooking.bus_booking_system.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest bookingRequest, Authentication authentication) {
        String email = authentication.getName();
        try {
            Booking booking = bookingService.createBooking(bookingRequest, email);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            logger.error("Booking failed for user {}: {}", email, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Internal server error during booking for user {}: {}", email, e.getMessage());
            return ResponseEntity.status(500).body("Internal server error: " + e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Booking>> getBookingHistory(Authentication authentication) {
        String email = authentication.getName();
        try {
            List<Booking> bookings = bookingService.getBookingHistory(email);
            return ResponseEntity.ok(bookings);
        } catch (RuntimeException e) {
            logger.error("Failed to fetch booking history for user {}: {}", email, e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Internal server error while fetching booking history for user {}: {}", email, e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }
}