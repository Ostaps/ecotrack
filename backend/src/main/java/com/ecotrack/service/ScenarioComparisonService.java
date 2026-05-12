package com.ecotrack.service;

import com.ecotrack.dto.ScenarioComparisonResponseDTO;
import com.ecotrack.dto.ScenarioRequestDTO;
import com.ecotrack.dto.ScenarioResultDTO;
import com.ecotrack.model.Shipment;
import com.ecotrack.model.Vehicle;
import com.ecotrack.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScenarioComparisonService {

    private static final String METHODOLOGY_VERSION = "GLEC Framework v3";
    private static final int MIN_SCENARIOS = 2;
    private static final int MAX_SCENARIOS = 10;

    private final VehicleRepository vehicleRepository;
    private final SustainabilityService sustainabilityService;

    public ScenarioComparisonResponseDTO compare(List<ScenarioRequestDTO> scenarios) {
        if (scenarios.size() < MIN_SCENARIOS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "At least " + MIN_SCENARIOS + " scenarios are required");
        }
        if (scenarios.size() > MAX_SCENARIOS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Maximum " + MAX_SCENARIOS + " scenarios allowed");
        }

        Set<UUID> vehicleIds = scenarios.stream()
                .map(ScenarioRequestDTO::getVehicleId)
                .collect(Collectors.toSet());

        Map<UUID, Vehicle> vehicleMap = vehicleRepository.findAllById(vehicleIds).stream()
                .collect(Collectors.toMap(Vehicle::getId, v -> v));

        List<ScenarioResultDTO> results = new ArrayList<>();

        for (int i = 0; i < scenarios.size(); i++) {
            ScenarioRequestDTO req = scenarios.get(i);
            Vehicle vehicle = vehicleMap.get(req.getVehicleId());
            if (vehicle == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Vehicle not found: " + req.getVehicleId());
            }

            Shipment transientShipment = Shipment.builder()
                    .origin(req.getOrigin())
                    .destination(req.getDestination())
                    .distanceKm(req.getDistanceKm())
                    .payloadTons(req.getPayloadTons())
                    .transportMode(req.getTransportMode())
                    .vehicle(vehicle)
                    .build();

            Double co2 = sustainabilityService.calculateEmissions(transientShipment, vehicle);
            String breakdown = sustainabilityService.buildBreakdown(transientShipment, vehicle);

            String label = req.getLabel() != null ? req.getLabel() : "Scenario " + (i + 1);

            results.add(ScenarioResultDTO.builder()
                    .label(label)
                    .vehicleModel(vehicle.getModel())
                    .vehicleFuelType(vehicle.getFuelType().name())
                    .transportMode(req.getTransportMode())
                    .distanceKm(req.getDistanceKm())
                    .payloadTons(req.getPayloadTons())
                    .estimatedCo2Kg(co2)
                    .calculationBreakdown(breakdown)
                    .build());
        }

        int preferredIndex = 0;
        double minCo2 = Double.MAX_VALUE;
        for (int i = 0; i < results.size(); i++) {
            if (results.get(i).getEstimatedCo2Kg() < minCo2) {
                minCo2 = results.get(i).getEstimatedCo2Kg();
                preferredIndex = i;
            }
        }

        return ScenarioComparisonResponseDTO.builder()
                .scenarios(results)
                .preferredScenarioIndex(preferredIndex)
                .methodologyVersion(METHODOLOGY_VERSION)
                .build();
    }
}
