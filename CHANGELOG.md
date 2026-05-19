# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Green Route Advisor v1 pre-shipment scenario comparison endpoint `POST /api/v1/shipments/compare-scenarios`.
- Scenario comparison request/response DTOs in backend for multi-scenario evaluation.
- Shipment Hub scenario comparison UX for estimated emissions and preferred scenario highlighting.

### Changed
- Shipment service now computes comparison scenarios through the existing sustainability calculation path with deterministic preferred scenario selection (`LOWEST_ESTIMATED_CO2E`).
- Repository secret-handling baseline improved with `.env` ignore policy and tracked `.env.example` template.

### Known limitations
- Backend `mvn test` is currently blocked in this environment by a compiler initialization error (`TypeTag::UNKNOWN`), so full acceptance verification remains pending.
- Automated determinism and boundary tests for scenario comparison are still outstanding follow-up items.
