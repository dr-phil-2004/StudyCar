package com.busbooking.bus_booking_system.repository;

import com.busbooking.bus_booking_system.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByBusId(Long busId); // Added method to find bookings by busId
}