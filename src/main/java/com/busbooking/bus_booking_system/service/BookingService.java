package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.controller.BookingRequest;
import com.busbooking.bus_booking_system.controller.PassengerRequest;
import com.busbooking.bus_booking_system.entity.Booking;
import com.busbooking.bus_booking_system.entity.Passenger;
import com.busbooking.bus_booking_system.entity.Trip;
import com.busbooking.bus_booking_system.entity.User;
import com.busbooking.bus_booking_system.repository.BookingRepository;
import com.busbooking.bus_booking_system.repository.PassengerRepository;
import com.busbooking.bus_booking_system.repository.TripRepository;
import com.busbooking.bus_booking_system.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final PassengerRepository passengerRepository;

    public BookingService(BookingRepository bookingRepository, UserRepository userRepository,
                          TripRepository tripRepository, PassengerRepository passengerRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.passengerRepository = passengerRepository;
    }

    @Transactional
    public Booking createBooking(BookingRequest bookingRequest, String email) {
        if (bookingRequest.getTripId() == null) {
            throw new RuntimeException("No trip ID provided in booking request");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Trip trip = tripRepository.findByIdForUpdate(bookingRequest.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        int requested = bookingRequest.getPassengers().size();
        if (trip.getAvailableSeats() < requested) {
            logger.warn("Not enough seats on trip {}", trip.getId());
            throw new RuntimeException("Not enough seats available");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTrip(trip);
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("CONFIRMED");
        booking = bookingRepository.save(booking);

        for (PassengerRequest pr : bookingRequest.getPassengers()) {
            Passenger passenger = new Passenger();
            passenger.setName(pr.getName());
            passenger.setAge(pr.getAge());
            passenger.setSeatNumber(pr.getSeatNumber());
            passenger.setBooking(booking);
            passengerRepository.save(passenger);
        }

        trip.setCurrentPassengers(trip.getCurrentPassengers() + requested);
        tripRepository.save(trip);

        return booking;
    }

    public List<Booking> getBookingHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserId(user.getId());
    }
}