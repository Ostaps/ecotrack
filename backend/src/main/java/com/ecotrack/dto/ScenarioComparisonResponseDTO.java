package com.ecotrack.dto;

import com.ecotrack.model.enums.TransportMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioComparisonResponseDTO {
    private String preferredScenarioId;
    private String preferredRule;
    private List<ScenarioResultDTO> scenarios;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScenarioResultDTO {
        private String scenarioId;
        private TransportMode transportMode;
        private UUID vehicleId;
        private String origin;
        private String destination;
        private Double distanceKm;
        private Double payloadTons;
        private Double estimatedCo2Kg;
        private String methodologyVersion;
        private String valueType;
    }
}
