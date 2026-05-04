package com.ecotrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioComparisonResponseDTO {
    private String preferredScenarioLabel;
    private String methodologyReference;
    private LocalDateTime comparisonTimestamp;
    private List<ScenarioComparisonResultDTO> scenarios;
}
