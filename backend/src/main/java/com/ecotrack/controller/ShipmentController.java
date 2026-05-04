package com.ecotrack.controller;

import com.ecotrack.dto.ScenarioComparisonRequestDTO;
import com.ecotrack.dto.ScenarioComparisonResponseDTO;
import com.ecotrack.dto.ShipmentDTO;
import com.ecotrack.dto.ShipmentDetailDTO;
import com.ecotrack.model.enums.ShipmentStatus;
import com.ecotrack.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shipments")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    @GetMapping
    public Page<ShipmentDTO> getAll(
            @RequestParam(required = false) ShipmentStatus status,
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(required = false) Double maxCo2,
            Pageable pageable) {
        return shipmentService.findAll(status, origin, dateFrom, dateTo, maxCo2, pageable);
    }

    @PostMapping
    public ResponseEntity<ShipmentDTO> create(@RequestBody ShipmentDTO dto) {
        return ResponseEntity.status(201).body(shipmentService.create(dto));
    }

    @PostMapping("/scenario-comparisons")
    public ScenarioComparisonResponseDTO compareScenarios(@RequestBody ScenarioComparisonRequestDTO request) {
        return shipmentService.compareScenarios(request);
    }

    @GetMapping("/{id}")
    public ShipmentDetailDTO getById(@PathVariable UUID id) {
        return shipmentService.findById(id);
    }

    @PatchMapping("/{id}/status")
    public ShipmentDTO updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        ShipmentStatus status = ShipmentStatus.valueOf(body.get("status").toUpperCase());
        return shipmentService.updateStatus(id, status);
    }

    @GetMapping("/live")
    public List<ShipmentDTO> getLive() {
        return shipmentService.getLive();
    }
}
