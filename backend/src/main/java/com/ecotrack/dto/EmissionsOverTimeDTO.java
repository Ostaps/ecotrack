package com.ecotrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EmissionsOverTimeDTO {
    private String month;   // "2025-01" format
    private Double actualCo2;
    private Double goalCo2;
}
