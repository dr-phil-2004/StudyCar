package com.busbooking.bus_booking_system.controller;

import com.busbooking.bus_booking_system.entity.Bus;
import com.busbooking.bus_booking_system.service.TrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PostMapping("/location")
    public ResponseEntity<Bus> updateLocation(@RequestBody LocationRequest request) {
        Bus bus = trackingService.updatePosition(
                request.getBusId(), request.getLatitude(), request.getLongitude(), request.getSpeed());
        return ResponseEntity.ok(bus);
    }
}

class LocationRequest {
    private Long busId;
    private Double latitude;
    private Double longitude;
    private Double speed;

    public Long getBusId() { return busId; }
    public void setBusId(Long busId) { this.busId = busId; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }
}