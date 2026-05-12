# Changelog

All notable changes to EcoTrack are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **Green Route Advisor: pre-shipment scenario comparison** (ECOTRACK-1)
  - `POST /api/v1/scenarios/compare` endpoint accepts 2–10 dispatch scenarios and returns per-scenario CO₂ estimates with a preferred (lowest emission) recommendation.
  - Reuses the existing `SustainabilityService` emission engine — no parallel calculation logic introduced.
  - Response includes methodology version (GLEC Framework v3) for audit traceability.
  - `ScenarioComparisonModal` frontend component accessible from the Shipment Hub.
  - Estimated values carry a visual indicator distinguishing them from confirmed data.
  - Backend validation: vehicle existence, min/max scenario count, positive distance and payload.
  - Unit tests for `ScenarioComparisonService` and `ScenarioController`.
- `scripts/start-dev.sh` — one-command startup for backend + frontend dev environment.
- Project-level `README.md` with setup instructions and feature documentation.
