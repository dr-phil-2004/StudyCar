package com.busbooking.bus_booking_system.repository;

import com.busbooking.bus_booking_system.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusRepository extends JpaRepository<Bus, Long> {
}