package com.ecotrack.dto;

import com.ecotrack.model.enums.FuelType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VehicleDTO {
    private UUID id;
    private String vin;
    private String model;
    private FuelType fuelType;
    private Double fuelConsumptionRate;
    private Double co2Factor;
    private Double efficiencyRating;
    private LocalDateTime lastService;
    private Double currentLoad;
}
