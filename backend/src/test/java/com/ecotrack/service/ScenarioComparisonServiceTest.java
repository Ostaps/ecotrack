package com.ecotrack.service;

import com.ecotrack.dto.ScenarioComparisonResponseDTO;
import com.ecotrack.dto.ScenarioRequestDTO;
import com.ecotrack.model.Vehicle;
import com.ecotrack.model.enums.FuelType;
import com.ecotrack.model.enums.TransportMode;
import com.ecotrack.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScenarioComparisonServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    private SustainabilityService sustainabilityService = new SustainabilityService();

    private ScenarioComparisonService service;

    private Vehicle dieselVehicle;
    private Vehicle electricVehicle;

    @BeforeEach
    void setUp() {
        service = new ScenarioComparisonService(vehicleRepository, sustainabilityService);

        dieselVehicle = Vehicle.builder()
                .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                .model("Volvo FH16")
                .fuelType(FuelType.DIESEL_EURO6)
                .co2Factor(0.025)
                .build();

        electricVehicle = Vehicle.builder()
                .id(UUID.fromString("22222222-2222-2222-2222-222222222222"))
                .model("Tesla Semi")
                .fuelType(FuelType.ELECTRIC)
                .co2Factor(0.020)
                .build();
    }

    @Test
    void compare_happyPath_returnsPreferredScenario() {
        when(vehicleRepository.findAllById(anyCollection()))
                .thenReturn(List.of(dieselVehicle, electricVehicle));

        List<ScenarioRequestDTO> scenarios = List.of(
                ScenarioRequestDTO.builder()
                        .vehicleId(dieselVehicle.getId())
                        .origin("Berlin")
                        .destination("Munich")
                        .distanceKm(600.0)
                        .payloadTons(20.0)
                        .transportMode(TransportMode.ROAD)
                        .label("Diesel route")
                        .build(),
                ScenarioRequestDTO.builder()
                        .vehicleId(electricVehicle.getId())
                        .origin("Berlin")
                        .destination("Munich")
                        .distanceKm(600.0)
                        .payloadTons(20.0)
                        .transportMode(TransportMode.ROAD)
                        .label("Electric route")
                        .build()
        );

        ScenarioComparisonResponseDTO result = service.compare(scenarios);

        assertThat(result.getScenarios()).hasSize(2);
        assertThat(result.getMethodologyVersion()).isEqualTo("GLEC Framework v3");
        assertThat(result.getPreferredScenarioIndex()).isEqualTo(1);
        assertThat(result.getScenarios().get(1).getEstimatedCo2Kg())
                .isLessThan(result.getScenarios().get(0).getEstimatedCo2Kg());
    }

    @Test
    void compare_determinism_sameInputsProduceSameOutputs() {
        when(vehicleRepository.findAllById(anyCollection()))
                .thenReturn(List.of(dieselVehicle));

        List<ScenarioRequestDTO> scenarios = List.of(
                ScenarioRequestDTO.builder()
                        .vehicleId(dieselVehicle.getId())
                        .origin("A").destination("B")
                        .distanceKm(500.0).payloadTons(10.0)
                        .transportMode(TransportMode.ROAD).build(),
                ScenarioRequestDTO.builder()
                        .vehicleId(dieselVehicle.getId())
                        .origin("A").destination("C")
                        .distanceKm(800.0).payloadTons(10.0)
                        .transportMode(TransportMode.ROAD).build()
        );

        Double firstResult = service.compare(scenarios).getScenarios().get(0).getEstimatedCo2Kg();
        for (int i = 0; i < 4; i++) {
            Double nextResult = service.compare(scenarios).getScenarios().get(0).getEstimatedCo2Kg();
            assertThat(nextResult).isEqualTo(firstResult);
        }
    }

    @Test
    void compare_lessThanTwoScenarios_returns400() {
        List<ScenarioRequestDTO> single = List.of(
                ScenarioRequestDTO.builder()
                        .vehicleId(dieselVehicle.getId())
                        .origin("A").destination("B")
                        .distanceKm(100.0).payloadTons(5.0)
                        .transportMode(TransportMode.ROAD).build()
        );

        assertThatThrownBy(() -> service.compare(single))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("At least 2");
    }

    @Test
    void compare_moreThanTenScenarios_returns400() {
        List<ScenarioRequestDTO> tooMany = new ArrayList<>();
        for (int i = 0; i < 11; i++) {
            tooMany.add(ScenarioRequestDTO.builder()
                    .vehicleId(dieselVehicle.getId())
                    .origin("A").destination("B")
                    .distanceKm(100.0).payloadTons(5.0)
                    .transportMode(TransportMode.ROAD).build());
        }

        assertThatThrownBy(() -> service.compare(tooMany))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Maximum 10");
    }

    @Test
    void compare_vehicleNotFound_returns404() {
        UUID missingId = UUID.randomUUID();
        when(vehicleRepository.findAllById(anyCollection())).thenReturn(List.of());

        List<ScenarioRequestDTO> scenarios = List.of(
                ScenarioRequestDTO.builder()
                        .vehicleId(missingId)
                        .origin("A").destination("B")
                        .distanceKm(100.0).payloadTons(5.0)
                        .transportMode(TransportMode.ROAD).build(),
                ScenarioRequestDTO.builder()
                        .vehicleId(missingId)
                        .origin("A").destination("C")
                        .distanceKm(200.0).payloadTons(5.0)
                        .transportMode(TransportMode.ROAD).build()
        );

        assertThatThrownBy(() -> service.compare(scenarios))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Vehicle not found");
    }

    @Test
    void compare_defaultLabelsWhenNotProvided() {
        when(vehicleRepository.findAllById(anyCollection()))
                .thenReturn(List.of(dieselVehicle));

        List<ScenarioRequestDTO> scenarios = List.of(
                ScenarioRequestDTO.builder()
                        .vehicleId(dieselVehicle.getId())
                        .origin("A").destination("B")
                        .distanceKm(500.0).payloadTons(10.0)
                        .transportMode(TransportMode.ROAD).build(),
                ScenarioRequestDTO.builder()
                        .vehicleId(dieselVehicle.getId())
                        .origin("A").destination("C")
                        .distanceKm(800.0).payloadTons(10.0)
                        .transportMode(TransportMode.ROAD).build()
        );

        ScenarioComparisonResponseDTO result = service.compare(scenarios);
        assertThat(result.getScenarios().get(0).getLabel()).isEqualTo("Scenario 1");
        assertThat(result.getScenarios().get(1).getLabel()).isEqualTo("Scenario 2");
    }
}
