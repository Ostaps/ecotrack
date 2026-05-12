package com.ecotrack.dto;

import com.ecotrack.model.enums.TransportMode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioRequestDTO {

    @NotNull
    private UUID vehicleId;

    @NotNull
    private String origin;

    @NotNull
    private String destination;

    @NotNull
    @Positive
    private Double distanceKm;

    @NotNull
    @Positive
    private Double payloadTons;

    @NotNull
    private TransportMode transportMode;

    private String label;
}
