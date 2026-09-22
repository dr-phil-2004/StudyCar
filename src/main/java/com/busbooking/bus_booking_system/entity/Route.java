package com.busbooking.bus_booking_system.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;               // ex: "CAL-UAC-01"
    private String name;               // ex: "Calavi -> ENEAM -> UAC"
    private String origin;
    private String destination;
    private Integer estimatedDurationMinutes;
    private Boolean active = true;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceOrder ASC")
    private List<Stop> stops;
}