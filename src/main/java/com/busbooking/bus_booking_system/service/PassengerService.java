package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.entity.Passenger;
import com.busbooking.bus_booking_system.repository.PassengerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PassengerService {

    private final PassengerRepository passengerRepository;

    public PassengerService(PassengerRepository passengerRepository) {
        this.passengerRepository = passengerRepository;
    }

    public List<Passenger> findByBookingId(Long bookingId) {
        return passengerRepository.findByBooking_Id(bookingId);
    }
}