package com.busbooking.bus_booking_system.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TrackingUpdate {
    private Long busId;
    private String busCode;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private LocalDateTime recordedAt;
}
