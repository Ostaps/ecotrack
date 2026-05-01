package com.ecotrack.model;

import com.ecotrack.model.enums.FuelType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vehicle")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String vin;

    private String model;

    @Enumerated(EnumType.STRING)
    private FuelType fuelType;

    /** liters/100km (or kWh/100km for EV) */
    private Double fuelConsumptionRate;

    /** kg CO2 per liter (or per kWh) */
    private Double co2Factor;

    /** 0.0 to 10.0 */
    private Double efficiencyRating;

    private LocalDateTime lastService;

    /** tons */
    private Double currentLoad;
}
