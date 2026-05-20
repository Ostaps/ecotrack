# Green Route Advisor v1

## Scope
Green Route Advisor v1 adds pre-shipment scenario comparison in Shipment Hub while reusing the existing emissions calculation path.

In scope:
- Compare at least two scenarios side-by-side from planning inputs.
- Determine preferred scenario by lowest estimated CO2e.
- Return methodology traceability in API response.
- Visually mark compared values as `Estimated`.

Out of scope:
- Any parallel emissions engine or alternate formula path.
- Multi-objective optimization (cost/time/carbon weighting).

## API Contract
Endpoint: `POST /api/v1/shipments/compare`

Request body:
- `scenarios`: array of scenario objects, minimum 2.
- Scenario fields: `name`, `origin`, `destination`, `distanceKm`, `payloadTons`, `transportMode`, `vehicleId`.

Response body:
- `preferredScenario`: scenario name with lowest estimated CO2e.
- `rankingRule`: `MIN_ESTIMATED_CO2E`.
- `methodologyVersion`: `GLEC Framework v3`.
- `scenarios`: result array with per-scenario estimate and `estimateLabel` (`Estimated`).

Validation behavior:
- Rejects requests with fewer than two scenarios.
- Rejects non-positive `distanceKm` and `payloadTons`.
- Rejects unsupported `transportMode` values.
- Rejects unknown `vehicleId` values.

## UI Behavior (Shipment Hub)
File: `frontend/src/pages/ShipmentHub.jsx`

- Adds a Green Route Advisor compare panel with two scenario inputs.
- Calls `compareShipmentScenarios` from `frontend/src/api/shipments.js`.
- Renders side-by-side estimated results and highlights preferred scenario.
- Shows ranking rule and methodology version returned by backend.

## Related Shipment Hub Fix
The Shipment Hub status dropdown now:
- Updates React state on selection.
- Filters shipment rows client-side (no extra request).
- Shows an explicit empty state when no rows match.
- Resets to `All Statuses` after successful shipment creation.

## Verification Status
Implemented and wired across backend/frontend. Full-suite validation is partially blocked by known pre-existing/global environment issues:
- Frontend project-wide lint includes unrelated violations in other pages.
- Backend `mvn test` fails in this environment due to toolchain initialization error.

Targeted validation completed during implementation:
- Changed Shipment Hub file lint passes.
- Compare flow wiring and response rendering are implemented and integrated.
