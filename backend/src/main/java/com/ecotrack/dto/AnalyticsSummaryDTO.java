package com.ecotrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AnalyticsSummaryDTO {
    private Double totalCo2Kg;
    private Double totalDistanceKm;
    private Double totalWeightTons;
    private Long shipmentsCount;
    private Double avgCo2PerShipment;
    private Long activeShipmentsCount;
}
