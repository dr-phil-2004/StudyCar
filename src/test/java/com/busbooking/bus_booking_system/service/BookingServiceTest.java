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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
public class BookingServiceTest {

    @Autowired
    private BookingService bookingService;

    @MockBean
    private BookingRepository bookingRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private BusRepository busRepository;

    @MockBean
    private PassengerRepository passengerRepository;

    @Test
    public void testCreateBooking() {
        // Mock User
        User user = new User();
        user.setId(1L);
        user.setEmail("testuser"); // Match the email used in the test
        user.setName("Test User");

        // Mock Bus
        Bus bus = new Bus();
        bus.setId(1L);
        bus.setAvailableSeats(10);

        // Mock Booking Request
        BookingRequest request = new BookingRequest();
        request.setBusId(1L);
        PassengerRequest passengerRequest = new PassengerRequest();
        passengerRequest.setName("John Doe");
        passengerRequest.setAge(30);
        passengerRequest.setSeatNumber("A1");
        request.setPassengers(List.of(passengerRequest));

        // Mock repository responses
        when(userRepository.findByEmail("testuser")).thenReturn(Optional.of(user)); // Mock findByEmail instead of findByName
        when(busRepository.findById(1L)).thenReturn(Optional.of(bus));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);
        when(passengerRepository.save(any(Passenger.class))).thenAnswer(i -> i.getArguments()[0]);
        when(busRepository.save(any(Bus.class))).thenAnswer(i -> i.getArguments()[0]);

        // Execute test
        Booking booking = bookingService.createBooking(request, "testuser");

        // Verify results
        assertNotNull(booking);
        assertEquals("CONFIRMED", booking.getStatus());
        assertEquals(user, booking.getUser());
        assertEquals(bus, booking.getBus());
        assertEquals(9, bus.getAvailableSeats()); // 10 - 1 passenger

        // Verify interactions
        verify(userRepository, times(1)).findByEmail("testuser");
        verify(busRepository, times(1)).findById(1L);
        verify(bookingRepository, times(1)).save(any(Booking.class));
        verify(passengerRepository, times(1)).save(any(Passenger.class));
        verify(busRepository, times(1)).save(bus);
    }
}