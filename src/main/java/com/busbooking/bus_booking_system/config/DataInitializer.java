package com.busbooking.bus_booking_system.config;

import com.busbooking.bus_booking_system.entity.*;
import com.busbooking.bus_booking_system.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RouteRepository routeRepository;
    private final StopRepository stopRepository;
    private final BusRepository busRepository;
    private final TripRepository tripRepository;
    private final PassengerEventRepository passengerEventRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    @Override
    public void run(String... args) {
        // 1. Initialisation Compte Admin par défaut
        userRepository.findByEmail("admin@bus.com").orElseGet(() -> {
            User admin = new User();
            admin.setName("Administrateur MTDI");
            admin.setEmail("admin@bus.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ROLE_ADMIN");
            return userRepository.save(admin);
        });

        if (routeRepository.count() > 0) return;

        // 2. Création des 4 lignes majeures du Campus (Zone Calavi / Cotonou / Porto-Novo)
        Route r1 = createRoute("CAL-UAC-01", "Calavi (Zogbadjè) -> ENEAM -> UAC", "Calavi", "UAC", 35);
        Route r2 = createRoute("COT-UAC-02", "Cotonou (Étoile) -> Akpakpa -> UAC", "Cotonou", "UAC", 50);
        Route r3 = createRoute("POR-UAC-03", "Porto-Novo -> UAC Campus", "Porto-Novo", "UAC", 75);
        Route r4 = createRoute("UID-UAC-04", "Ouidah -> Allada -> UAC", "Ouidah", "UAC", 60);

        // 3. Implantation d'arrêts géospatiaux réalistes au Bénin
        // Ligne 1 : Calavi - UAC
        Stop s1 = createStop(r1, "Calavi Marché", 6.4489, 2.3554, 1);
        Stop s2 = createStop(r1, "Akassato Centre", 6.4310, 2.3495, 2);
        Stop s3 = createStop(r1, "Gbégamey / ENEAM", 6.3966, 2.3312, 3);
        Stop s4 = createStop(r1, "UAC Terminus", 6.4025, 2.3387, 4);

        // Ligne 2 : Cotonou - UAC
        Stop s5 = createStop(r2, "Akpakpa Sacré-Cœur", 6.3712, 2.4501, 1);
        Stop s6 = createStop(r2, "Carrefour Étoile", 6.3654, 2.4211, 2);
        Stop s7 = createStop(r2, "Cadjehoun", 6.3582, 2.3842, 3);
        Stop s8 = createStop(r2, "UAC Terminus", 6.4025, 2.3387, 4);

        // 4. Déploiement d'une flotte de 8 bus physiques
        Bus b1 = createBus("BUS-01", "RB-1001-ZN", 60, r1);
        Bus b2 = createBus("BUS-02", "RB-1002-ZN", 60, r1);
        Bus b3 = createBus("BUS-03", "RB-2001-CO", 70, r2);
        Bus b4 = createBus("BUS-04", "RB-2002-CO", 70, r2);
        Bus b5 = createBus("BUS-05", "RB-3001-PN", 80, r3);
        Bus b6 = createBus("BUS-06", "RB-4001-OU", 60, r4);

        // 5. Génération de Trajets (Trips) actifs
        Trip t1 = createTrip(b1, r1, 58, Trip.TripStatus.IN_PROGRESS);  // Quasi saturé (58/60)
        Trip t2 = createTrip(b2, r1, 15, Trip.TripStatus.IN_PROGRESS);  // Sous-charge (15/60)
        Trip t3 = createTrip(b3, r2, 68, Trip.TripStatus.IN_PROGRESS);  // Surchargé (68/70)
        Trip t4 = createTrip(b4, r2, 65, Trip.TripStatus.IN_PROGRESS);  // Élevé
        Trip t5 = createTrip(b5, r3, 12, Trip.TripStatus.IN_PROGRESS);  // Faible (12/80)

        // 6. Injection de 5 000+ données de trafic simulées pour l'Analytics (BOARDING, ALIGHTING, WAITING)
        // Ligne Calavi - Forte affluence
        generateMassiveEvents(t1, s1, 1500, 0, 80);  // Gros volume d'attente à Calavi
        generateMassiveEvents(t1, s2, 800, 200, 45);
        generateMassiveEvents(t1, s3, 300, 600, 10);
        generateMassiveEvents(t1, s4, 0, 1700, 0);   // Tout le monde descend au terminus UAC

        // Ligne Cotonou - Saturation aux heures de pointe
        generateMassiveEvents(t3, s5, 1800, 0, 110); // Zone de forte congestion
        generateMassiveEvents(t3, s6, 900, 100, 65);
        generateMassiveEvents(t3, s8, 0, 2500, 0);
    }

    private Route createRoute(String code, String name, String origin, String destination, int duration) {
        Route r = new Route(); r.setCode(code); r.setName(name); r.setOrigin(origin); r.setDestination(destination); r.setEstimatedDurationMinutes(duration); r.setActive(true);
        return routeRepository.save(r);
    }

    private Stop createStop(Route r, String name, double lat, double lng, int order) {
        Stop s = new Stop(); s.setRoute(r); s.setName(name); s.setLatitude(lat); s.setLongitude(lng); s.setSequenceOrder(order);
        return stopRepository.save(s);
    }

    private Bus createBus(String code, String reg, int cap, Route r) {
        Bus b = new Bus(); b.setCode(code); b.setRegistrationNumber(reg); b.setCapacity(cap); b.setActive(true); b.setRoute(r); b.setLatitude(6.4489); b.setLongitude(2.3554);
        return busRepository.save(b);
    }

    private Trip createTrip(Bus b, Route r, int pass, Trip.TripStatus status) {
        Trip t = new Trip(); t.setBus(b); t.setRoute(r); t.setDepartureTime(LocalDateTime.now()); t.setArrivalTime(LocalDateTime.now().plusMinutes(r.getEstimatedDurationMinutes())); t.setCurrentPassengers(pass); t.setStatus(status);
        return tripRepository.save(t);
    }

    private void generateMassiveEvents(Trip t, Stop s, int board, int alight, int wait) {
        if (board > 0) createEvent(t, s, PassengerEvent.EventType.BOARDING, board);
        if (alight > 0) createEvent(t, s, PassengerEvent.EventType.ALIGHTING, alight);
        if (wait > 0) createEvent(t, s, PassengerEvent.EventType.WAITING, wait);
    }

    private void createEvent(Trip t, Stop s, PassengerEvent.EventType type, int count) {
        PassengerEvent e = new PassengerEvent(); e.setTrip(t); e.setStop(s); e.setType(type); e.setPassengerCount(count); e.setTimestamp(LocalDateTime.now().minusHours(random.nextInt(6)));
        passengerEventRepository.save(e);
    }
}
