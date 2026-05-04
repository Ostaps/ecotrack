package com.ecotrack.service;

import com.ecotrack.dto.ScenarioComparisonRequestDTO;
import com.ecotrack.dto.ScenarioComparisonResponseDTO;
import com.ecotrack.dto.ScenarioComparisonScenarioDTO;
import com.ecotrack.model.Vehicle;
import com.ecotrack.model.enums.FuelType;
import com.ecotrack.model.enums.TransportMode;
import com.ecotrack.repository.EmissionLogRepository;
import com.ecotrack.repository.ShipmentRepository;
import com.ecotrack.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShipmentServiceTest {

    @Mock
    private ShipmentRepository shipmentRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private EmissionLogRepository emissionLogRepository;

    @Mock
    private SustainabilityService sustainabilityService;

    @InjectMocks
    private ShipmentService shipmentService;

    @Test
    void compareScenariosReturnsDeterministicRankingWithoutPersistence() {
        UUID efficientVehicleId = UUID.randomUUID();
        UUID dieselVehicleId = UUID.randomUUID();

        Vehicle efficientVehicle = Vehicle.builder()
                .id(efficientVehicleId)
                .model("Volta")
                .fuelType(FuelType.ELECTRIC)
                .co2Factor(0.5)
                .build();
        Vehicle dieselVehicle = Vehicle.builder()
                .id(dieselVehicleId)
                .model("Atlas")
                .fuelType(FuelType.DIESEL_EURO6)
                .co2Factor(2.4)
                .build();

        when(vehicleRepository.findById(efficientVehicleId)).thenReturn(Optional.of(efficientVehicle));
        when(vehicleRepository.findById(dieselVehicleId)).thenReturn(Optional.of(dieselVehicle));
        when(sustainabilityService.calculateEmissions(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(efficientVehicle)))
                .thenReturn(90.0);
        when(sustainabilityService.calculateEmissions(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(dieselVehicle)))
                .thenReturn(180.0);

        ScenarioComparisonRequestDTO request = ScenarioComparisonRequestDTO.builder()
                .scenarios(List.of(
                        buildScenario("Scenario B", 600.0, 8.0, efficientVehicleId),
                        buildScenario("Scenario A", 600.0, 8.0, dieselVehicleId)
                ))
                .build();

        ScenarioComparisonResponseDTO firstResult = shipmentService.compareScenarios(request);
        ScenarioComparisonResponseDTO secondResult = shipmentService.compareScenarios(request);

        assertEquals("Scenario B", firstResult.getPreferredScenarioLabel());
        assertEquals(List.of("Scenario B", "Scenario A"),
                firstResult.getScenarios().stream().map(result -> result.getScenarioLabel()).toList());
        assertEquals(
                firstResult.getScenarios().stream().map(result -> result.getEstimatedCo2Kg()).toList(),
                secondResult.getScenarios().stream().map(result -> result.getEstimatedCo2Kg()).toList()
        );
        assertEquals(1, firstResult.getScenarios().get(0).getRank());
        assertEquals(Boolean.TRUE, firstResult.getScenarios().get(0).getPreferred());
        verify(shipmentRepository, never()).save(org.mockito.ArgumentMatchers.any());
        verify(emissionLogRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void compareScenariosRejectsInvalidPayload() {
        ScenarioComparisonRequestDTO request = ScenarioComparisonRequestDTO.builder()
                .scenarios(List.of(
                        buildScenario("Scenario A", 600.0, 0.0, UUID.randomUUID()),
                        buildScenario("Scenario B", 700.0, 5.0, UUID.randomUUID())
                ))
                .build();

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> shipmentService.compareScenarios(request)
        );

        assertEquals("Scenario 1: payloadTons must be greater than 0.", exception.getMessage());
    }

    @Test
    void compareScenariosRejectsUnknownVehicle() {
        UUID missingVehicleId = UUID.randomUUID();
        when(vehicleRepository.findById(missingVehicleId)).thenReturn(Optional.empty());

        ScenarioComparisonRequestDTO request = ScenarioComparisonRequestDTO.builder()
                .scenarios(List.of(
                        buildScenario("Scenario A", 500.0, 5.0, missingVehicleId),
                        buildScenario("Scenario B", 550.0, 5.0, UUID.randomUUID())
                ))
                .build();

        assertThrows(EntityNotFoundException.class, () -> shipmentService.compareScenarios(request));
    }

    private ScenarioComparisonScenarioDTO buildScenario(String label, double distanceKm, double payloadTons, UUID vehicleId) {
        return ScenarioComparisonScenarioDTO.builder()
                .scenarioLabel(label)
                .origin("Berlin")
                .destination("Paris")
                .originLat(52.52)
                .originLon(13.405)
                .destinationLat(48.8566)
                .destinationLon(2.3522)
                .distanceKm(distanceKm)
                .payloadTons(payloadTons)
                .transportMode(TransportMode.ROAD)
                .vehicleId(vehicleId)
                .build();
    }
}
