package com.ecotrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EsgReportDTO {
    private String company;
    private String reportingPeriod;
    private String methodology;
    private Double totalVerifiedEmissionsKgCo2e;
    private List<EmissionsByModeDTO> emissionsByMode;
    private Map<String, Long> fleetComposition;  // fuelType -> count
    private Long totalShipments;
    private Double totalDistanceKm;
    private Double avgCo2PerShipment;
    private String generatedAt;
}
