package com.busbooking.bus_booking_system.repository;

import com.busbooking.bus_booking_system.entity.PassengerEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PassengerEventRepository extends JpaRepository<PassengerEvent, Long> {
    List<PassengerEvent> findByTripIdAndStopId(Long tripId, Long stopId);
    List<PassengerEvent> findByStopId(Long stopId);
}