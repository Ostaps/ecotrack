package com.ecotrack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioComparisonResponseDTO {

    private List<ScenarioResultDTO> scenarios;
    private int preferredScenarioIndex;
    private String methodologyVersion;
}
