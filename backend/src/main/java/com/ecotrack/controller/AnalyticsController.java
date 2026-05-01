package com.ecotrack.controller;

import com.ecotrack.dto.*;
import com.ecotrack.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard/summary")
    public AnalyticsSummaryDTO getDashboardSummary() {
        return analyticsService.getDashboardSummary();
    }

    @GetMapping("/emissions-over-time")
    public List<EmissionsOverTimeDTO> getEmissionsOverTime() {
        return analyticsService.getEmissionsOverTime();
    }

    @GetMapping("/by-transport-mode")
    public List<EmissionsByModeDTO> getByTransportMode() {
        return analyticsService.getEmissionsByTransportMode();
    }

    @GetMapping("/top-polluting-routes")
    public List<RouteEmissionDTO> getTopPollutingRoutes() {
        return analyticsService.getTopPollutingRoutes();
    }

    @GetMapping("/reports/esg")
    public EsgReportDTO getEsgReport() {
        return analyticsService.getEsgReport();
    }
}
