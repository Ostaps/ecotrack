package com.ecotrack.controller;

import com.ecotrack.dto.ScenarioComparisonResponseDTO;
import com.ecotrack.dto.ScenarioRequestDTO;
import com.ecotrack.dto.ScenarioResultDTO;
import com.ecotrack.model.enums.TransportMode;
import com.ecotrack.service.ScenarioComparisonService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ScenarioController.class)
class ScenarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ScenarioComparisonService scenarioComparisonService;

    @Test
    void compare_happyPath_returns200() throws Exception {
        ScenarioComparisonResponseDTO response = ScenarioComparisonResponseDTO.builder()
                .scenarios(List.of(
                        ScenarioResultDTO.builder()
                                .label("Route A").vehicleModel("Volvo FH16").vehicleFuelType("DIESEL_EURO6")
                                .transportMode(TransportMode.ROAD).distanceKm(600.0).payloadTons(20.0)
                                .estimatedCo2Kg(300.0).calculationBreakdown("{}").build(),
                        ScenarioResultDTO.builder()
                                .label("Route B").vehicleModel("Tesla Semi").vehicleFuelType("ELECTRIC")
                                .transportMode(TransportMode.ROAD).distanceKm(600.0).payloadTons(20.0)
                                .estimatedCo2Kg(36.0).calculationBreakdown("{}").build()
                ))
                .preferredScenarioIndex(1)
                .methodologyVersion("GLEC Framework v3")
                .build();

        when(scenarioComparisonService.compare(anyList())).thenReturn(response);

        List<ScenarioRequestDTO> request = List.of(
                ScenarioRequestDTO.builder()
                        .vehicleId(UUID.randomUUID()).origin("Berlin").destination("Munich")
                        .distanceKm(600.0).payloadTons(20.0).transportMode(TransportMode.ROAD).build(),
                ScenarioRequestDTO.builder()
                        .vehicleId(UUID.randomUUID()).origin("Berlin").destination("Munich")
                        .distanceKm(600.0).payloadTons(20.0).transportMode(TransportMode.ROAD).build()
        );

        mockMvc.perform(post("/api/v1/scenarios/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.methodologyVersion").value("GLEC Framework v3"))
                .andExpect(jsonPath("$.preferredScenarioIndex").value(1))
                .andExpect(jsonPath("$.scenarios.length()").value(2));
    }

    @Test
    void compare_tooFewScenarios_returns400() throws Exception {
        when(scenarioComparisonService.compare(anyList()))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least 2 scenarios are required"));

        List<ScenarioRequestDTO> request = List.of(
                ScenarioRequestDTO.builder()
                        .vehicleId(UUID.randomUUID()).origin("A").destination("B")
                        .distanceKm(100.0).payloadTons(5.0).transportMode(TransportMode.ROAD).build()
        );

        mockMvc.perform(post("/api/v1/scenarios/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void compare_vehicleNotFound_returns404() throws Exception {
        when(scenarioComparisonService.compare(anyList()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found: ..."));

        List<ScenarioRequestDTO> request = List.of(
                ScenarioRequestDTO.builder()
                        .vehicleId(UUID.randomUUID()).origin("A").destination("B")
                        .distanceKm(100.0).payloadTons(5.0).transportMode(TransportMode.ROAD).build(),
                ScenarioRequestDTO.builder()
                        .vehicleId(UUID.randomUUID()).origin("A").destination("C")
                        .distanceKm(200.0).payloadTons(5.0).transportMode(TransportMode.ROAD).build()
        );

        mockMvc.perform(post("/api/v1/scenarios/compare")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }
}
