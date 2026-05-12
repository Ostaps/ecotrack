package com.ecotrack.dto;

import com.ecotrack.model.enums.TransportMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioResultDTO {

    private String label;
    private String vehicleModel;
    private String vehicleFuelType;
    private TransportMode transportMode;
    private Double distanceKm;
    private Double payloadTons;
    private Double estimatedCo2Kg;
    private String calculationBreakdown;
}
