package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.entity.Bus;
import com.busbooking.bus_booking_system.entity.BusLocation;
import com.busbooking.bus_booking_system.repository.BusLocationRepository;
import com.busbooking.bus_booking_system.repository.BusRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BusService {

    private final BusRepository busRepository;
    private final BusLocationRepository busLocationRepository;

    public BusService(BusRepository busRepository, BusLocationRepository busLocationRepository) {
        this.busRepository = busRepository;
        this.busLocationRepository = busLocationRepository;
    }

    public List<Bus> findAllBuses() {
        return busRepository.findAll();
    }

    public Bus findById(Long id) {
        return busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found"));
    }

    public Bus updatePosition(Long busId, Double latitude, Double longitude, Double speed) {
        Bus bus = findById(busId);
        bus.setLatitude(latitude);
        bus.setLongitude(longitude);
        busRepository.save(bus);

        BusLocation location = new BusLocation();
        location.setBus(bus);
        location.setLatitude(latitude);
        location.setLongitude(longitude);
        location.setSpeed(speed);
        location.setRecordedAt(LocalDateTime.now());
        busLocationRepository.save(location);

        return bus;
    }
}