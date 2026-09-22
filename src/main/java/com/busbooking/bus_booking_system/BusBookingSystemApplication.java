package com.busbooking.bus_booking_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.busbooking.bus_booking_system.repository")
@EntityScan(basePackages = "com.busbooking.bus_booking_system.entity")
public class BusBookingSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(BusBookingSystemApplication.class, args);
    }
}
