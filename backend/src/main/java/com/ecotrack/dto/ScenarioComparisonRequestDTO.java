package com.ecotrack.dto;

import lombok.Data;

import java.util.List;

@Data
public class ScenarioComparisonRequestDTO {
    private List<ScenarioInputDTO> scenarios;
}
