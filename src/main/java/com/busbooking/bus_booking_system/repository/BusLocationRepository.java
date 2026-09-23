package com.busbooking.bus_booking_system.repository;

import com.busbooking.bus_booking_system.entity.BusLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BusLocationRepository extends JpaRepository<BusLocation, Long> {
    Optional<BusLocation> findTopByBusIdOrderByRecordedAtDesc(Long busId);
}