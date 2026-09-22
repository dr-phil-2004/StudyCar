package com.busbooking.bus_booking_system.config;

import com.busbooking.bus_booking_system.entity.Bus;
import com.busbooking.bus_booking_system.entity.User;
import com.busbooking.bus_booking_system.repository.BusRepository;
import com.busbooking.bus_booking_system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BusRepository busRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           BusRepository busRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.busRepository = busRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // ✅ 1. Create ADMIN user if not exists
        userRepository.findByEmail("admin@bus.com")
                .orElseGet(() -> {
                    User admin = new User();
                    admin.setName("Admin");
                    admin.setEmail("admin@bus.com");
                    admin.setPassword(passwordEncoder.encode("admin123"));
                    admin.setRole("ROLE_ADMIN"); // IMPORTANT for Spring Security
                    return userRepository.save(admin);
                });

        // ✅ 2. Create initial bus if DB is empty
        if (busRepository.count() == 0) {
            Bus bus = new Bus();
            bus.setFromLocation("Chennai");
            bus.setToLocation("Bangalore");
            bus.setDepartureTime(LocalDateTime.now().plusDays(1));
            bus.setArrivalTime(LocalDateTime.now().plusDays(1).plusHours(6));
            bus.setPrice(850);
            bus.setAvailableSeats(40);

            busRepository.save(bus);
        }
    }
}
