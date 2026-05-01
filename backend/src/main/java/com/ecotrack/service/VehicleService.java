package com.ecotrack.service;

import com.ecotrack.dto.VehicleDTO;
import com.ecotrack.model.Vehicle;
import com.ecotrack.model.enums.FuelType;
import com.ecotrack.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public Page<VehicleDTO> findAll(Pageable pageable) {
        return vehicleRepository.findAll(pageable).map(this::toDTO);
    }

    public VehicleDTO findById(UUID id) {
        return vehicleRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found: " + id));
    }

    @Transactional
    public VehicleDTO create(VehicleDTO dto) {
        if (vehicleRepository.existsByVin(dto.getVin())) {
            throw new IllegalArgumentException("Vehicle with VIN already exists: " + dto.getVin());
        }
        Vehicle vehicle = toEntity(dto);
        return toDTO(vehicleRepository.save(vehicle));
    }

    @Transactional
    public VehicleDTO update(UUID id, VehicleDTO dto) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found: " + id));
        existing.setModel(dto.getModel());
        existing.setFuelType(dto.getFuelType());
        existing.setFuelConsumptionRate(dto.getFuelConsumptionRate());
        existing.setCo2Factor(dto.getCo2Factor());
        existing.setEfficiencyRating(dto.getEfficiencyRating());
        existing.setLastService(dto.getLastService());
        existing.setCurrentLoad(dto.getCurrentLoad());
        return toDTO(vehicleRepository.save(existing));
    }

    public VehicleDTO getEfficiency(UUID id) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found: " + id));
        return VehicleDTO.builder()
                .id(v.getId())
                .model(v.getModel())
                .fuelConsumptionRate(v.getFuelConsumptionRate())
                .efficiencyRating(v.getEfficiencyRating())
                .co2Factor(v.getCo2Factor())
                .build();
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────

    public VehicleDTO toDTO(Vehicle v) {
        return VehicleDTO.builder()
                .id(v.getId())
                .vin(v.getVin())
                .model(v.getModel())
                .fuelType(v.getFuelType())
                .fuelConsumptionRate(v.getFuelConsumptionRate())
                .co2Factor(v.getCo2Factor())
                .efficiencyRating(v.getEfficiencyRating())
                .lastService(v.getLastService())
                .currentLoad(v.getCurrentLoad())
                .build();
    }

    private Vehicle toEntity(VehicleDTO dto) {
        return Vehicle.builder()
                .vin(dto.getVin())
                .model(dto.getModel())
                .fuelType(dto.getFuelType())
                .fuelConsumptionRate(dto.getFuelConsumptionRate())
                .co2Factor(dto.getCo2Factor())
                .efficiencyRating(dto.getEfficiencyRating())
                .lastService(dto.getLastService())
                .currentLoad(dto.getCurrentLoad())
                .build();
    }
}
