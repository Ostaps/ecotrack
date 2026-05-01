package com.ecotrack.controller;

import com.ecotrack.dto.VehicleDTO;
import com.ecotrack.model.EmissionLog;
import com.ecotrack.service.AnalyticsService;
import com.ecotrack.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final AnalyticsService analyticsService;

    @GetMapping
    public Page<VehicleDTO> getAll(Pageable pageable) {
        return vehicleService.findAll(pageable);
    }

    @PostMapping
    public ResponseEntity<VehicleDTO> create(@RequestBody VehicleDTO dto) {
        return ResponseEntity.status(201).body(vehicleService.create(dto));
    }

    @GetMapping("/{id}")
    public VehicleDTO getById(@PathVariable UUID id) {
        return vehicleService.findById(id);
    }

    @PutMapping("/{id}")
    public VehicleDTO update(@PathVariable UUID id, @RequestBody VehicleDTO dto) {
        return vehicleService.update(id, dto);
    }

    @GetMapping("/{id}/efficiency")
    public VehicleDTO getEfficiency(@PathVariable UUID id) {
        return vehicleService.getEfficiency(id);
    }

    @GetMapping("/{id}/fuel-history")
    public List<EmissionLog> getFuelHistory(@PathVariable UUID id) {
        return analyticsService.getFuelHistoryForVehicle(id);
    }
}
