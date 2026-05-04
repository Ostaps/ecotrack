package com.ecotrack.service;

import com.ecotrack.dto.ScenarioComparisonRequestDTO;
import com.ecotrack.dto.ScenarioComparisonResponseDTO;
import com.ecotrack.dto.ScenarioComparisonResultDTO;
import com.ecotrack.dto.ScenarioComparisonScenarioDTO;
import com.ecotrack.dto.ShipmentDTO;
import com.ecotrack.dto.ShipmentDetailDTO;
import com.ecotrack.model.EmissionLog;
import com.ecotrack.model.Shipment;
import com.ecotrack.model.Vehicle;
import com.ecotrack.model.enums.FuelType;
import com.ecotrack.model.enums.ShipmentStatus;
import com.ecotrack.repository.EmissionLogRepository;
import com.ecotrack.repository.ShipmentRepository;
import com.ecotrack.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShipmentService {

    private static final String METHODOLOGY_REFERENCE = "GLEC Framework v3";

    private final ShipmentRepository shipmentRepository;
    private final VehicleRepository vehicleRepository;
    private final EmissionLogRepository emissionLogRepository;
    private final SustainabilityService sustainabilityService;

    public Page<ShipmentDTO> findAll(ShipmentStatus status, String origin,
                                     LocalDateTime dateFrom, LocalDateTime dateTo,
                                     Double maxCo2, Pageable pageable) {
        return shipmentRepository
                .findWithFilters(status, origin, dateFrom, dateTo, maxCo2, pageable)
                .map(this::toDTO);
    }

    public ShipmentDetailDTO findById(UUID id) {
        Shipment s = shipmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found: " + id));
        return toDetailDTO(s);
    }

    @Transactional
    public ShipmentDTO create(ShipmentDTO dto) {
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found: " + dto.getVehicleId()));

        Shipment shipment = Shipment.builder()
                .trackingId(generateTrackingId())
                .origin(dto.getOrigin())
                .destination(dto.getDestination())
                .distanceKm(dto.getDistanceKm())
                .payloadTons(dto.getPayloadTons())
                .status(dto.getStatus() != null ? dto.getStatus() : ShipmentStatus.PENDING)
                .transportMode(dto.getTransportMode())
                .originLat(dto.getOriginLat())
                .originLon(dto.getOriginLon())
                .destinationLat(dto.getDestinationLat())
                .destinationLon(dto.getDestinationLon())
                .createdAt(LocalDateTime.now())
                .estimatedArrival(dto.getEstimatedArrival())
                .vehicle(vehicle)
                .build();

        // Trigger CO2 calculation
        Double co2 = sustainabilityService.calculateEmissions(shipment, vehicle);
        shipment.setCalculatedCo2(co2);

        Shipment saved = shipmentRepository.save(shipment);

        // Persist EmissionLog
        String breakdown = sustainabilityService.buildBreakdown(shipment, vehicle);
        EmissionLog log = EmissionLog.builder()
                .shipment(saved)
                .carbonValue(co2)
                .calculationBreakdown(breakdown)
                .timestamp(LocalDateTime.now())
                .build();
        emissionLogRepository.save(log);

        return toDTO(saved);
    }

    @Transactional
    public ShipmentDTO updateStatus(UUID id, ShipmentStatus status) {
        Shipment s = shipmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Shipment not found: " + id));
        s.setStatus(status);
        return toDTO(shipmentRepository.save(s));
    }

    public List<ShipmentDTO> getLive() {
        return shipmentRepository.findByStatusNot(ShipmentStatus.DELIVERED)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ScenarioComparisonResponseDTO compareScenarios(ScenarioComparisonRequestDTO request) {
        validateComparisonRequest(request);

        List<ScenarioComparisonResultDTO> rankedScenarios = request.getScenarios().stream()
                .map(this::buildScenarioResult)
                .sorted(Comparator
                        .comparing(ScenarioComparisonResultDTO::getEstimatedCo2Kg)
                        .thenComparing(ScenarioComparisonResultDTO::getDistanceKm)
                        .thenComparing(result -> result.getScenarioLabel().toLowerCase(Locale.ROOT)))
                .collect(Collectors.toList());

        for (int index = 0; index < rankedScenarios.size(); index++) {
            rankedScenarios.get(index).setRank(index + 1);
            rankedScenarios.get(index).setPreferred(index == 0);
        }

        return ScenarioComparisonResponseDTO.builder()
                .preferredScenarioLabel(rankedScenarios.get(0).getScenarioLabel())
                .methodologyReference(METHODOLOGY_REFERENCE)
                .comparisonTimestamp(LocalDateTime.now())
                .scenarios(rankedScenarios)
                .build();
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────

    public ShipmentDTO toDTO(Shipment s) {
        Vehicle v = s.getVehicle();
        return ShipmentDTO.builder()
                .id(s.getId())
                .trackingId(s.getTrackingId())
                .origin(s.getOrigin())
                .destination(s.getDestination())
                .distanceKm(s.getDistanceKm())
                .payloadTons(s.getPayloadTons())
                .calculatedCo2(s.getCalculatedCo2())
                .status(s.getStatus())
                .transportMode(s.getTransportMode())
                .originLat(s.getOriginLat())
                .originLon(s.getOriginLon())
                .destinationLat(s.getDestinationLat())
                .destinationLon(s.getDestinationLon())
                .createdAt(s.getCreatedAt())
                .estimatedArrival(s.getEstimatedArrival())
                .vehicleId(v != null ? v.getId() : null)
                .vehicleModel(v != null ? v.getModel() : null)
                .vehicleFuelType(v != null ? v.getFuelType().name() : null)
                .build();
    }

    private ShipmentDetailDTO toDetailDTO(Shipment s) {
        Vehicle v = s.getVehicle();
        double base = 0, afterFuel = 0, afterHaul = 0;
        double fuelMult = 1.0;
        boolean longHaul = false, euro5 = false;

        if (v != null) {
            base = s.getDistanceKm() * s.getPayloadTons() * v.getCo2Factor();
            fuelMult = switch (v.getFuelType()) {
                case ELECTRIC -> 0.15;
                case HYDROGEN -> 0.25;
                default -> 1.0;
            };
            afterFuel = base * fuelMult;
            longHaul = s.getDistanceKm() > 1000;
            afterHaul = longHaul ? afterFuel * 1.1 : afterFuel;
            euro5 = v.getFuelType() == FuelType.DIESEL_EURO5;
        }

        return ShipmentDetailDTO.builder()
                .id(s.getId())
                .trackingId(s.getTrackingId())
                .origin(s.getOrigin())
                .destination(s.getDestination())
                .distanceKm(s.getDistanceKm())
                .payloadTons(s.getPayloadTons())
                .calculatedCo2(s.getCalculatedCo2())
                .status(s.getStatus())
                .transportMode(s.getTransportMode())
                .originLat(s.getOriginLat())
                .originLon(s.getOriginLon())
                .destinationLat(s.getDestinationLat())
                .destinationLon(s.getDestinationLon())
                .createdAt(s.getCreatedAt())
                .estimatedArrival(s.getEstimatedArrival())
                .vehicleId(v != null ? v.getId() : null)
                .vehicleModel(v != null ? v.getModel() : null)
                .vehicleVin(v != null ? v.getVin() : null)
                .vehicleFuelType(v != null ? v.getFuelType().name() : null)
                .vehicleEfficiencyRating(v != null ? v.getEfficiencyRating() : null)
                .baseEmission(Math.round(base * 100.0) / 100.0)
                .afterFuelMultiplier(Math.round(afterFuel * 100.0) / 100.0)
                .afterLongHaulPenalty(Math.round(afterHaul * 100.0) / 100.0)
                .finalCo2(s.getCalculatedCo2())
                .fuelMultiplierApplied(String.valueOf(fuelMult))
                .longHaulPenaltyApplied(longHaul)
                .euro5TaxApplied(euro5)
                .calculationFormula("E = D × W × EF (" + METHODOLOGY_REFERENCE + ")")
                .build();
    }

    private ScenarioComparisonResultDTO buildScenarioResult(ScenarioComparisonScenarioDTO scenario) {
        Vehicle vehicle = vehicleRepository.findById(scenario.getVehicleId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found: " + scenario.getVehicleId()));

        Shipment shipmentProjection = Shipment.builder()
                .origin(scenario.getOrigin())
                .destination(scenario.getDestination())
                .originLat(scenario.getOriginLat())
                .originLon(scenario.getOriginLon())
                .destinationLat(scenario.getDestinationLat())
                .destinationLon(scenario.getDestinationLon())
                .distanceKm(scenario.getDistanceKm())
                .payloadTons(scenario.getPayloadTons())
                .transportMode(scenario.getTransportMode())
                .build();

        Double estimatedCo2 = sustainabilityService.calculateEmissions(shipmentProjection, vehicle);

        return ScenarioComparisonResultDTO.builder()
                .scenarioLabel(scenario.getScenarioLabel().trim())
                .estimatedCo2Kg(estimatedCo2)
                .preferred(false)
                .origin(scenario.getOrigin().trim())
                .destination(scenario.getDestination().trim())
                .distanceKm(scenario.getDistanceKm())
                .payloadTons(scenario.getPayloadTons())
                .transportMode(scenario.getTransportMode())
                .vehicleId(vehicle.getId())
                .vehicleModel(vehicle.getModel())
                .vehicleFuelType(vehicle.getFuelType().name())
                .explanation(buildScenarioExplanation())
                .build();
    }

    private String buildScenarioExplanation() {
        return String.format(
                Locale.ROOT,
                "Estimated using %s. Lower CO2 ranks first; ties go to shorter distance.",
                METHODOLOGY_REFERENCE
        );
    }

    private void validateComparisonRequest(ScenarioComparisonRequestDTO request) {
        if (request == null || request.getScenarios() == null) {
            throw new IllegalArgumentException("Comparison request must include scenarios.");
        }

        if (request.getScenarios().size() < 2 || request.getScenarios().size() > 4) {
            throw new IllegalArgumentException("Comparison requires between 2 and 4 scenarios.");
        }

        Set<String> labels = new HashSet<>();
        for (int index = 0; index < request.getScenarios().size(); index++) {
            ScenarioComparisonScenarioDTO scenario = request.getScenarios().get(index);
            String prefix = "Scenario " + (index + 1) + ": ";

            if (scenario == null) {
                throw new IllegalArgumentException(prefix + "data is required.");
            }

            validateRequiredText(scenario.getScenarioLabel(), prefix + "scenarioLabel is required.");
            validateRequiredText(scenario.getOrigin(), prefix + "origin is required.");
            validateRequiredText(scenario.getDestination(), prefix + "destination is required.");

            String normalizedLabel = scenario.getScenarioLabel().trim().toLowerCase(Locale.ROOT);
            if (!labels.add(normalizedLabel)) {
                throw new IllegalArgumentException("Scenario labels must be unique.");
            }

            validateRequiredNumber(scenario.getOriginLat(), prefix + "originLat is required.");
            validateRequiredNumber(scenario.getOriginLon(), prefix + "originLon is required.");
            validateRequiredNumber(scenario.getDestinationLat(), prefix + "destinationLat is required.");
            validateRequiredNumber(scenario.getDestinationLon(), prefix + "destinationLon is required.");

            if (scenario.getDistanceKm() == null || scenario.getDistanceKm() <= 0) {
                throw new IllegalArgumentException(prefix + "distanceKm must be greater than 0.");
            }

            if (scenario.getPayloadTons() == null || scenario.getPayloadTons() <= 0) {
                throw new IllegalArgumentException(prefix + "payloadTons must be greater than 0.");
            }

            if (scenario.getTransportMode() == null) {
                throw new IllegalArgumentException(prefix + "transportMode is required.");
            }

            if (scenario.getVehicleId() == null) {
                throw new IllegalArgumentException(prefix + "vehicleId is required.");
            }
        }
    }

    private void validateRequiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
    }

    private void validateRequiredNumber(Double value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
    }

    private String generateTrackingId() {
        int year = LocalDateTime.now().getYear();
        long count = shipmentRepository.count() + 1;
        return String.format("ECO-%d-%05d", year, count);
    }
}
