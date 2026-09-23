package com.busbooking.bus_booking_system.repository;

import com.busbooking.bus_booking_system.entity.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StopRepository extends JpaRepository<Stop, Long> {
    List<Stop> findByRouteIdOrderBySequenceOrderAsc(Long routeId);
}