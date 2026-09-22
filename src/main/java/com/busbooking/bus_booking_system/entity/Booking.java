package com.busbooking.bus_booking_system.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "trip_id")
    private Trip trip;

    private LocalDateTime bookingTime;
    private LocalDateTime holdExpiresAt;   // nouveau : pour le hold temporaire (voir cas limite 200 étudiants)
    private String status; // "HELD", "CONFIRMED", "CANCELLED", "EXPIRED"

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    private List<Passenger> passengers;
}