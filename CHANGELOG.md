# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [2026-05-20]

### Added
- Green Route Advisor v1 scenario comparison endpoint: `POST /api/v1/shipments/compare`.
- Scenario comparison DTOs for request/response payloads:
  - `backend/src/main/java/com/ecotrack/dto/ScenarioComparisonRequestDTO.java`
  - `backend/src/main/java/com/ecotrack/dto/ScenarioComparisonResponseDTO.java`
  - `backend/src/main/java/com/ecotrack/dto/ScenarioInputDTO.java`
  - `backend/src/main/java/com/ecotrack/dto/ScenarioResultDTO.java`
- Shipment Hub UI support for side-by-side estimated scenario comparison and preferred scenario highlighting.
- Client-side Shipment Hub status filter behavior and empty-state handling.

### Changed
- Shipment service now compares at least two scenarios using existing `SustainabilityService` logic, with explicit rule `MIN_ESTIMATED_CO2E` and methodology version `GLEC Framework v3`.
- Shipment Hub status filter resets to `All Statuses` after creating a shipment.

### Known Limitations
- Full project frontend lint remains blocked by pre-existing issues outside feature scope.
- Backend test execution in this environment is blocked by local Java compiler/toolchain initialization error.
