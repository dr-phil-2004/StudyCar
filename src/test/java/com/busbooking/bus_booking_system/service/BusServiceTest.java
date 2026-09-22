package com.busbooking.bus_booking_system.service;

import com.busbooking.bus_booking_system.entity.Bus;
import com.busbooking.bus_booking_system.repository.BusRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@SpringBootTest
public class BusServiceTest {

    @Autowired
    private BusService busService;

    @MockBean
    private BusRepository busRepository;

    @Test
    public void testFindBuses() {
        Bus bus = new Bus();
        bus.setFromLocation("CityA");
        bus.setToLocation("CityB");
        when(busRepository.findByFromLocationAndToLocation("CityA", "CityB")).thenReturn(List.of(bus));

        List<Bus> buses = busService.findBuses("CityA", "CityB");
        assertEquals(1, buses.size());
        assertEquals("CityA", buses.get(0).getFromLocation());
    }
}