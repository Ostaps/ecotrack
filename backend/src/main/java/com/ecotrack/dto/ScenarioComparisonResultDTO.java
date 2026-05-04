package com.ecotrack.dto;

import com.ecotrack.model.enums.TransportMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioComparisonResultDTO {
    private String scenarioLabel;
    private Integer rank;
    private Boolean preferred;
    private Double estimatedCo2Kg;
    private String explanation;
    private String origin;
    private String destination;
    private Double distanceKm;
    private Double payloadTons;
    private TransportMode transportMode;
    private UUID vehicleId;
    private String vehicleModel;
    private String vehicleFuelType;
}
