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
public class ScenarioComparisonRequestDTO {
    private List<ScenarioInputDTO> scenarios;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScenarioInputDTO {
        private String scenarioId;
        private TransportMode transportMode;
        private UUID vehicleId;
        private String origin;
        private String destination;
        private Double distanceKm;
        private Double payloadTons;
    }
}
