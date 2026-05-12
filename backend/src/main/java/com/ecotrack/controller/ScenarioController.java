package com.ecotrack.controller;

import com.ecotrack.dto.ScenarioComparisonResponseDTO;
import com.ecotrack.dto.ScenarioRequestDTO;
import com.ecotrack.service.ScenarioComparisonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

    private final ScenarioComparisonService scenarioComparisonService;

    @PostMapping("/compare")
    public ResponseEntity<ScenarioComparisonResponseDTO> compare(
            @RequestBody @Valid List<ScenarioRequestDTO> scenarios) {
        return ResponseEntity.ok(scenarioComparisonService.compare(scenarios));
    }
}
