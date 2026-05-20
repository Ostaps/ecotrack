package com.ecotrack.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ScenarioInputDTO {
    private String name;
    private String origin;
    private String destination;
    private Double distanceKm;
    private Double payloadTons;
    private String transportMode;
    private UUID vehicleId;
}
