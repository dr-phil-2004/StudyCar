package com.busbooking.bus_booking_system.repository;

import com.busbooking.bus_booking_system.entity.Trip;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByRouteId(Long routeId);
    @EntityGraph(attributePaths = {"bus", "route", "route.stops"})
    List<Trip> findByStatus(Trip.TripStatus status);

    // verrou pessimiste : bloque la ligne "trip" le temps de la transaction.
    // Si 200 étudiants réservent la même Trip en même temps, les requêtes
    // concurrentes attendent leur tour au lieu de lire une donnée périmée
    // et de survendre les places.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Trip t where t.id = :id")
    Optional<Trip> findByIdForUpdate(@Param("id") Long id);
}