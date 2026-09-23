package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.dto.TrackingUpdate;
import com.busbooking.bus_booking_system.entity.Bus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TrackingService {
    private final BusService busService;
    private final SimpMessagingTemplate messagingTemplate;

    public TrackingService(BusService busService, SimpMessagingTemplate messagingTemplate) {
        this.busService = busService;
        this.messagingTemplate = messagingTemplate;
    }

    public Bus updatePosition(Long busId, Double latitude, Double longitude, Double speed) {
        Bus bus = busService.updatePosition(busId, latitude, longitude, speed);

        TrackingUpdate update = TrackingUpdate.builder()
                .busId(bus.getId())
                .busCode(bus.getCode())
                .latitude(bus.getLatitude())
                .longitude(bus.getLongitude())
                .speed(speed)
                .recordedAt(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/buses", update);
        messagingTemplate.convertAndSend("/topic/buses/" + bus.getId(), update);
        return bus;
    }
}