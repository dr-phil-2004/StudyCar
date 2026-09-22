package com.busbooking.bus_booking_system.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Stop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double latitude;
    private Double longitude;
    private Integer sequenceOrder;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private Route route;
}