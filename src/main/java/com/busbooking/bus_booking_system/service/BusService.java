package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.entity.Bus;
import com.busbooking.bus_booking_system.repository.BusRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BusService {

    private final BusRepository busRepository;

    public BusService(BusRepository busRepository) {
        this.busRepository = busRepository;
    }

    public List<Bus> findBuses(String from, String to) {
        return busRepository.findByFromLocationAndToLocation(from, to);
    }

    public Bus findById(Long id) {
        return busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found"));
    }

    public List<Bus> findAllBuses() {
        return busRepository.findAll();
    }
}