package com.ecotrack.service;

import com.ecotrack.dto.*;
import com.ecotrack.model.EmissionLog;
import com.ecotrack.model.Vehicle;
import com.ecotrack.model.enums.FuelType;
import com.ecotrack.repository.EmissionLogRepository;
import com.ecotrack.repository.ShipmentRepository;
import com.ecotrack.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final ShipmentRepository shipmentRepository;
    private final VehicleRepository vehicleRepository;
    private final EmissionLogRepository emissionLogRepository;

    public AnalyticsSummaryDTO getDashboardSummary() {
        Double totalCo2 = shipmentRepository.sumAllCo2();
        Double totalDist = shipmentRepository.sumAllDistance();
        Double totalWeight = shipmentRepository.sumAllPayload();
        long count = shipmentRepository.count();
        long active = shipmentRepository.countInTransit();

        return AnalyticsSummaryDTO.builder()
                .totalCo2Kg(totalCo2)
                .totalDistanceKm(totalDist)
                .totalWeightTons(totalWeight)
                .shipmentsCount(count)
                .avgCo2PerShipment(count > 0 ? Math.round((totalCo2 / count) * 100.0) / 100.0 : 0.0)
                .activeShipmentsCount(active)
                .build();
    }

    public List<EmissionsOverTimeDTO> getEmissionsOverTime() {
        LocalDateTime since = LocalDateTime.now().minusMonths(12);
        List<Object[]> rows = shipmentRepository.findMonthlyEmissions(since);

        // Build map: "YYYY-MM" -> actualCo2
        Map<String, Double> actualMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            double co2 = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            actualMap.put(String.format("%d-%02d", year, month), co2);
        }

        // Fill in all 12 months (even if no data) and compute goals
        List<EmissionsOverTimeDTO> result = new ArrayList<>();
        LocalDateTime cursor = since.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        Double prevGoal = null;

        for (int i = 0; i < 12; i++) {
            String key = String.format("%d-%02d", cursor.getYear(), cursor.getMonthValue());
            double actual = actualMap.getOrDefault(key, 0.0);

            double goal;
            if (prevGoal == null) {
                // First month: goal = actual * 1.05 (reverse-engineer: next month goal = this * 0.95)
                goal = actual * 1.05;
            } else {
                goal = Math.round(prevGoal * 0.95 * 100.0) / 100.0;
            }
            prevGoal = goal;

            result.add(EmissionsOverTimeDTO.builder()
                    .month(key)
                    .actualCo2(Math.round(actual * 100.0) / 100.0)
                    .goalCo2(Math.round(goal * 100.0) / 100.0)
                    .build());
            cursor = cursor.plusMonths(1);
        }
        return result;
    }

    public List<EmissionsByModeDTO> getEmissionsByTransportMode() {
        List<Object[]> rows = shipmentRepository.sumCo2ByTransportMode();
        double total = rows.stream()
                .mapToDouble(r -> r[1] != null ? ((Number) r[1]).doubleValue() : 0.0)
                .sum();

        return rows.stream().map(row -> {
            String mode = row[0].toString();
            double co2 = row[1] != null ? ((Number) row[1]).doubleValue() : 0.0;
            double pct = total > 0 ? Math.round((co2 / total * 100.0) * 10.0) / 10.0 : 0.0;
            return EmissionsByModeDTO.builder()
                    .mode(mode)
                    .totalCo2(Math.round(co2 * 100.0) / 100.0)
                    .percentage(pct)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<RouteEmissionDTO> getTopPollutingRoutes() {
        List<Object[]> rows = shipmentRepository.findTopPollutingRoutes(PageRequest.of(0, 5));
        return rows.stream().map(row -> {
            String origin = (String) row[0];
            String dest = (String) row[1];
            double co2 = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            long cnt = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            return RouteEmissionDTO.builder()
                    .origin(origin)
                    .destination(dest)
                    .route(origin + " → " + dest)
                    .totalCo2(Math.round(co2 * 100.0) / 100.0)
                    .shipmentCount(cnt)
                    .build();
        }).collect(Collectors.toList());
    }

    public EsgReportDTO getEsgReport() {
        AnalyticsSummaryDTO summary = getDashboardSummary();
        List<EmissionsByModeDTO> byMode = getEmissionsByTransportMode();

        // Fleet composition: fuelType -> count
        List<Vehicle> vehicles = vehicleRepository.findAll();
        Map<String, Long> fleetComp = vehicles.stream()
                .collect(Collectors.groupingBy(v -> v.getFuelType().name(), Collectors.counting()));

        return EsgReportDTO.builder()
                .company("EcoTrack Client S.A.")
                .reportingPeriod(String.valueOf(LocalDateTime.now().getYear()))
                .methodology("Calculated per GLEC Framework v3 using E = D × W × EF")
                .totalVerifiedEmissionsKgCo2e(summary.getTotalCo2Kg())
                .emissionsByMode(byMode)
                .fleetComposition(fleetComp)
                .totalShipments(summary.getShipmentsCount())
                .totalDistanceKm(summary.getTotalDistanceKm())
                .avgCo2PerShipment(summary.getAvgCo2PerShipment())
                .generatedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }

    public List<EmissionLog> getFuelHistoryForVehicle(UUID vehicleId) {
        return emissionLogRepository.findByShipmentVehicleId(vehicleId);
    }
}
