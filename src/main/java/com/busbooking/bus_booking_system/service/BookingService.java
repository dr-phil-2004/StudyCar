package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.controller.BookingRequest;
import com.busbooking.bus_booking_system.controller.PassengerRequest;
import com.busbooking.bus_booking_system.entity.Booking;
import com.busbooking.bus_booking_system.entity.Bus;
import com.busbooking.bus_booking_system.entity.Passenger;
import com.busbooking.bus_booking_system.entity.User;
import com.busbooking.bus_booking_system.repository.BookingRepository;
import com.busbooking.bus_booking_system.repository.BusRepository;
import com.busbooking.bus_booking_system.repository.PassengerRepository;
import com.busbooking.bus_booking_system.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BusRepository busRepository;
    private final PassengerRepository passengerRepository;

    public BookingService(BookingRepository bookingRepository, UserRepository userRepository,
                          BusRepository busRepository, PassengerRepository passengerRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.busRepository = busRepository;
        this.passengerRepository = passengerRepository;
    }

    @Transactional
    public Booking createBooking(BookingRequest bookingRequest, String email) {
        logger.info("Creating booking for user: {}, busId: {}", email, bookingRequest.getBusId());

        if (bookingRequest.getBusId() == null) {
            logger.error("Bus ID is null in booking request");
            throw new RuntimeException("No bus ID provided in booking request");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", email);
                    return new RuntimeException("User not found");
                });

        Bus bus = busRepository.findById(bookingRequest.getBusId())
                .orElseThrow(() -> {
                    logger.error("Bus not found: {}", bookingRequest.getBusId());
                    return new RuntimeException("Bus not found");
                });

        logger.info("Available seats: {}, Requested passengers: {}", bus.getAvailableSeats(), bookingRequest.getPassengers().size());
        if (bus.getAvailableSeats() < bookingRequest.getPassengers().size()) {
            logger.warn("Not enough seats available for bus: {}", bus.getId());
            throw new RuntimeException("Not enough seats available");
        }

        // Check for existing seat numbers
        Set<String> requestedSeats = bookingRequest.getPassengers().stream()
                .map(PassengerRequest::getSeatNumber)
                .collect(Collectors.toSet());
        List<Booking> existingBookings = bookingRepository.findByBusId(bookingRequest.getBusId());
        Set<String> occupiedSeats = existingBookings.stream()
                .flatMap(b -> b.getPassengers().stream())
                .map(Passenger::getSeatNumber)
                .collect(Collectors.toSet());
        requestedSeats.retainAll(occupiedSeats);
        if (!requestedSeats.isEmpty()) {
            logger.warn("Seats already booked for bus {}: {}", bus.getId(), requestedSeats);
            throw new RuntimeException("Seats " + String.join(", ", requestedSeats) + " are already booked");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setBus(bus);
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus("CONFIRMED");
        booking = bookingRepository.save(booking);
        logger.info("Booking saved with ID: {}", booking.getId());

        for (PassengerRequest pr : bookingRequest.getPassengers()) {
            logger.info("Saving passenger: name={}, age={}, seatNumber={}", pr.getName(), pr.getAge(), pr.getSeatNumber());
            Passenger passenger = new Passenger();
            passenger.setName(pr.getName());
            passenger.setAge(pr.getAge());
            passenger.setSeatNumber(pr.getSeatNumber());
            passenger.setBooking(booking);
            passengerRepository.save(passenger);
        }

        bus.setAvailableSeats(bus.getAvailableSeats() - bookingRequest.getPassengers().size());
        busRepository.save(bus);
        logger.info("Updated bus available seats: {}", bus.getAvailableSeats());

        return booking;
    }

    public List<Booking> getBookingHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.error("User not found with email: {}", email);
                    return new RuntimeException("User not found");
                });
        return bookingRepository.findByUserId(user.getId());
    }
}