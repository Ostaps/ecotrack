package com.ecotrack.service;

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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShipmentService {

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
                .calculationFormula("E = D × W × EF (GLEC Framework v3)")
                .build();
    }

    private String generateTrackingId() {
        int year = LocalDateTime.now().getYear();
        long count = shipmentRepository.count() + 1;
        return String.format("ECO-%d-%05d", year, count);
    }
}
