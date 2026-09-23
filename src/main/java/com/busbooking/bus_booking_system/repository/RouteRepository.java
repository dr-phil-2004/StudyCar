package com.busbooking.bus_booking_system.repository;

import com.busbooking.bus_booking_system.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteRepository extends JpaRepository<Route, Long> {
}