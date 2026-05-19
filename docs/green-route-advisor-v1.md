# Green Route Advisor v1: Scenario Comparison

## Scope

Implemented in v1:

- Compare at least two dispatch scenarios before shipment creation.
- Rank scenarios with deterministic rule `LOWEST_ESTIMATED_CO2E`.
- Reuse existing emission calculation service (no parallel engine).
- Return methodology traceability fields for estimated outputs.
- Show estimated-value messaging in Shipment Hub comparison flow.

Deferred:

- Multi-objective ranking (cost/ETA blending)
- Advanced route optimization
- External emission-factor integrations

## API summary

- Route: `POST /api/v1/shipments/compare-scenarios`
- Input model fields per scenario: `transportMode`, `vehicleId`, `origin`, `destination`, `distanceKm`, `payloadTons`, optional `scenarioId`
- Deterministic preference rule: minimum `estimatedCo2Kg`, tie-break by `scenarioId`

## Implementation paths

- `backend/src/main/java/com/ecotrack/controller/ShipmentController.java`
- `backend/src/main/java/com/ecotrack/service/ShipmentService.java`
- `backend/src/main/java/com/ecotrack/dto/ScenarioComparisonRequestDTO.java`
- `backend/src/main/java/com/ecotrack/dto/ScenarioComparisonResponseDTO.java`
- `frontend/src/api/shipments.js`
- `frontend/src/pages/ShipmentHub.jsx`

## Release notes for reviewers

- Feature-level frontend lint/build checks passed for changed files.
- End-to-end backend verification is pending environment toolchain fix.
- Methodology version value currently comes from service constant and should be validated with sustainability stakeholders.
