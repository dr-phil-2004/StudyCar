package com.busbooking.bus_booking_system.repository;

import com.busbooking.bus_booking_system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByName(String name);
    Optional<User> findByEmail(String email); // Ensure this exists
}