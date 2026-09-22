package com.busbooking.bus_booking_system.controller;

import java.util.List;

public class BookingRequest {
    private Long busId;
    private List<PassengerRequest> passengers;

    public Long getBusId() { return busId; }
    public void setBusId(Long busId) { this.busId = busId; }
    public List<PassengerRequest> getPassengers() { return passengers; }
    public void setPassengers(List<PassengerRequest> passengers) { this.passengers = passengers; }
}