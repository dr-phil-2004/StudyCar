package com.busbooking.bus_booking_system.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "bus_id")
    private Bus bus;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private Route route;

    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;

    private Integer currentPassengers = 0;

    @Enumerated(EnumType.STRING)
    private TripStatus status = TripStatus.SCHEDULED;

    public enum TripStatus {
        SCHEDULED, IN_PROGRESS, COMPLETED
    }

    @Transient
    public double getOccupancyRate() {
        if (bus == null || bus.getCapacity() == null || bus.getCapacity() == 0) return 0;
        return (currentPassengers * 100.0) / bus.getCapacity();
    }

    @Transient
    public int getAvailableSeats() {
        if (bus == null || bus.getCapacity() == null) return 0;
        return bus.getCapacity() - currentPassengers;
    }
}