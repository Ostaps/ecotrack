package com.ecotrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RouteEmissionDTO {
    private String origin;
    private String destination;
    private String route;
    private Double totalCo2;
    private Long shipmentCount;
}
