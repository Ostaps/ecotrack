package com.ecotrack.dto;

import com.ecotrack.model.enums.ShipmentStatus;
import com.ecotrack.model.enums.TransportMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ShipmentDetailDTO {
    private UUID id;
    private String trackingId;
    private String origin;
    private String destination;
    private Double distanceKm;
    private Double payloadTons;
    private Double calculatedCo2;
    private ShipmentStatus status;
    private TransportMode transportMode;
    private Double originLat;
    private Double originLon;
    private Double destinationLat;
    private Double destinationLon;
    private LocalDateTime createdAt;
    private LocalDateTime estimatedArrival;

    // Vehicle info
    private UUID vehicleId;
    private String vehicleModel;
    private String vehicleVin;
    private String vehicleFuelType;
    private Double vehicleEfficiencyRating;

    // Emission breakdown
    private Double baseEmission;
    private Double afterFuelMultiplier;
    private Double afterLongHaulPenalty;
    private Double finalCo2;
    private String fuelMultiplierApplied;
    private Boolean longHaulPenaltyApplied;
    private Boolean euro5TaxApplied;
    private String calculationFormula;
}
