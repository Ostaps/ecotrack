# Green Route Advisor v1

## Summary

Green Route Advisor v1 adds pre-shipment scenario comparison to Shipment Hub. Users can compare 2 to 4 candidate routes using existing planning inputs, see estimated CO2 values side by side, and get one preferred scenario ranked by explicit deterministic rules.

This feature is implemented in:

- `backend/src/main/java/com/ecotrack/controller/ShipmentController.java`
- `backend/src/main/java/com/ecotrack/service/ShipmentService.java`
- `backend/src/main/java/com/ecotrack/service/SustainabilityService.java`
- `frontend/src/api/shipments.js`
- `frontend/src/pages/ShipmentHub.jsx`

## Scope

Included in v1:

- compare 2 to 4 scenarios in a single request
- reuse the existing emissions calculation path in `backend/src/main/java/com/ecotrack/service/SustainabilityService.java`
- return a methodology reference with each comparison
- show estimated values clearly in the Shipment Hub compare modal
- keep comparison read-only with no shipment or emission-log persistence

Explicitly out of scope:

- saved scenario drafts
- comparison history
- route optimization
- cost or SLA scoring
- a second emissions engine

## UI flow

Entry point: `frontend/src/pages/ShipmentHub.jsx`

1. Open `Shipment Hub`
2. Select `Compare Scenarios`
3. Enter 2 to 4 planning scenarios and run the comparison

Each result card is labeled `Estimated` and the preferred scenario is highlighted separately from shipment creation.

## API contract

Endpoint:

- `POST /api/v1/shipments/scenario-comparisons`

Request body:

- `scenarios[]`
- each scenario includes `scenarioLabel`, `origin`, `destination`, `originLat`, `originLon`, `destinationLat`, `destinationLon`, `distanceKm`, `payloadTons`, `transportMode`, `vehicleId`

Response body:

- `preferredScenarioLabel`
- `methodologyReference`
- `comparisonTimestamp`
- `scenarios[]` with `rank`, `preferred`, `estimatedCo2Kg`, echoed planning inputs, vehicle metadata, and explanation text

Ranking order:

1. lowest `estimatedCo2Kg`
2. lowest `distanceKm`
3. lexical ascending `scenarioLabel`

Methodology reference returned today:

- `GLEC Framework v3`

## Current verification status

Implemented behavior matches the design intent, but the last review did not mark the feature merge-ready yet.

Open blockers from review:

- malformed `transportMode` enum and malformed `vehicleId` UUID inputs fail during request binding before `ShipmentService.compareScenarios(...)` validation runs, so they are not yet normalized into the comparison feature's expected `{ error, message, timestamp }` 400 response shape
- backend automated verification still needs to run on Java 17-compatible tooling because the current Java 21 environment fails Maven compilation during Lombok processing before `ShipmentServiceTest` executes

Non-blocking follow-up noted in review:

- scenario explanation copy in `backend/src/main/java/com/ecotrack/service/ShipmentService.java` does not yet mention the third tie-break on `scenarioLabel`
