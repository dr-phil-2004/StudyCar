package com.busbooking.bus_booking_system.controller;

public class PassengerRequest {
    private String name;
    private int age;
    private String seatNumber;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }
}