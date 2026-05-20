package com.ecotrack.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ScenarioComparisonResponseDTO {
    private String preferredScenario;
    private String rankingRule;
    private String methodologyVersion;
    private List<ScenarioResultDTO> scenarios;
}
