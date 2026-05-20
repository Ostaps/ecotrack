package com.ecotrack.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScenarioResultDTO {
    private String scenario;
    private String origin;
    private String destination;
    private String transportMode;
    private Double distanceKm;
    private Double payloadTons;
    private String vehicleModel;
    private Double estimatedCo2;
    private String estimateLabel;
    private boolean preferred;
}
