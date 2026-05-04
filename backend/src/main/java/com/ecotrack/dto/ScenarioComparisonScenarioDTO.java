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
public class ScenarioComparisonScenarioDTO {
    private String scenarioLabel;
    private String origin;
    private String destination;
    private Double originLat;
    private Double originLon;
    private Double destinationLat;
    private Double destinationLon;
    private Double distanceKm;
    private Double payloadTons;
    private TransportMode transportMode;
    private UUID vehicleId;
}
