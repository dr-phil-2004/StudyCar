package com.busbooking.bus_booking_system.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class PassengerEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne
    @JoinColumn(name = "stop_id")
    private Stop stop;

    @Enumerated(EnumType.STRING)
    private EventType type;

    private Integer passengerCount;
    private LocalDateTime timestamp;

    public enum EventType {
        BOARDING, ALIGHTING, WAITING
    }
}