package com.ecotrack.config;

import com.ecotrack.dto.ShipmentDTO;
import com.ecotrack.model.Vehicle;
import com.ecotrack.model.enums.ShipmentStatus;
import com.ecotrack.model.enums.TransportMode;
import com.ecotrack.repository.ShipmentRepository;
import com.ecotrack.repository.VehicleRepository;
import com.ecotrack.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final VehicleRepository vehicleRepository;
    private final ShipmentRepository shipmentRepository;
    private final ShipmentService shipmentService;

    @Override
    public void run(String... args) throws Exception {
        if (shipmentRepository.count() > 0) {
            return; // Already seeded
        }

        List<Vehicle> vehicles = vehicleRepository.findAll();
        if (vehicles.isEmpty()) {
            return; // Wait for data.sql to run
        }

        Random random = new Random(42);
        
        String[][] routes = {
                {"Lviv", "49.84", "24.02", "Berlin", "52.52", "13.40", "950.0"},
                {"Berlin", "52.52", "13.40", "Paris", "48.85", "2.35", "1050.0"},
                {"Paris", "48.85", "2.35", "Madrid", "40.41", "-3.70", "1270.0"},
                {"Madrid", "40.41", "-3.70", "Archena", "38.11", "-1.30", "390.0"},
                {"Lviv", "49.84", "24.02", "Warsaw", "52.23", "21.01", "400.0"},
                {"Warsaw", "52.23", "21.01", "Vienna", "48.21", "16.37", "600.0"},
                {"Vienna", "48.21", "16.37", "Milan", "45.46", "9.19", "800.0"}
        };

        for (int i = 0; i < 100; i++) {
            String[] route = routes[random.nextInt(routes.length)];
            
            // Distribute status: 30% PENDING, 50% IN_TRANSIT, 15% DELIVERED, 5% DELAYED
            int r = random.nextInt(100);
            ShipmentStatus status;
            if (r < 30) status = ShipmentStatus.PENDING;
            else if (r < 80) status = ShipmentStatus.IN_TRANSIT;
            else if (r < 95) status = ShipmentStatus.DELIVERED;
            else status = ShipmentStatus.DELAYED;

            // Distribute transport mode: 70% ROAD, 15% RAIL, 10% SEA, 5% AIR
            int m = random.nextInt(100);
            TransportMode mode;
            if (m < 70) mode = TransportMode.ROAD;
            else if (m < 85) mode = TransportMode.RAIL;
            else if (m < 95) mode = TransportMode.SEA;
            else mode = TransportMode.AIR;

            double payload = 5.0 + (20.0 * random.nextDouble()); // 5 to 25t
            Vehicle vehicle = vehicles.get(random.nextInt(vehicles.size()));
            
            // Randomize past/future dates for realistic charts (spread over last 12 months)
            LocalDateTime createdAt = LocalDateTime.now().minusDays(random.nextInt(365));
            LocalDateTime estimatedArrival = createdAt.plusDays(random.nextInt(10) + 1);

            ShipmentDTO dto = ShipmentDTO.builder()
                    .origin(route[0])
                    .originLat(Double.parseDouble(route[1]))
                    .originLon(Double.parseDouble(route[2]))
                    .destination(route[3])
                    .destinationLat(Double.parseDouble(route[4]))
                    .destinationLon(Double.parseDouble(route[5]))
                    .distanceKm(Double.parseDouble(route[6]) * (0.9 + 0.2 * random.nextDouble())) // slight variation
                    .payloadTons(Math.round(payload * 10.0) / 10.0)
                    .status(status)
                    .transportMode(mode)
                    .estimatedArrival(estimatedArrival)
                    .vehicleId(vehicle.getId())
                    .build();

            // Use the service to calculate CO2 and create emission log
            shipmentService.create(dto);
        }
        
        // Manual update of createdAt dates (service uses now() internally)
        shipmentRepository.findAll().forEach(s -> {
            s.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(365)));
            shipmentRepository.save(s);
        });
    }
}
