package com.busbooking.bus_booking_system.controller;

import java.util.List;

public class BookingRequest {
    private Long tripId;
    private List<PassengerRequest> passengers;

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }
    public List<PassengerRequest> getPassengers() { return passengers; }
    public void setPassengers(List<PassengerRequest> passengers) { this.passengers = passengers; }
}