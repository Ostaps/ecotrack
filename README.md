# EcoTrack — ESG Logistics Intelligence Platform

EcoTrack helps logistics teams track, compare, and reduce carbon emissions across shipment operations. It provides real-time visibility into CO₂ output per route, vehicle, and transport mode.

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Backend  | Java 17, Spring Boot 3.3, Spring Data JPA, H2 |
| Frontend | React 19, Vite, Tailwind CSS, Recharts, Leaflet |
| Build    | Maven (backend), npm (frontend)               |

## Quick Start

### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+

### One-command startup

```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

This boots the backend on `http://localhost:8080` and the frontend on `http://localhost:3000`.

### Manual startup

**Backend:**

```bash
cd backend
mvn spring-boot:run
```

**Frontend:**

```bash
cd frontend
npm ci
npm run dev
```

## Features

### Shipment Hub

Central dashboard for viewing and creating shipments. Displays shipment status, origin/destination, vehicle, and emission data.

### Green Route Advisor — Scenario Comparison

Compare 2–10 dispatch scenarios side by side before shipping to find the lowest-CO₂ option.

**How it works:**

1. Open the Shipment Hub and click **Compare Scenarios**.
2. Fill in at least two scenarios (vehicle, origin, destination, distance, payload, transport mode).
3. Click **Compare** — the API calculates estimated CO₂ for each scenario using the existing emission engine.
4. The **Greenest Option** is highlighted (lowest estimated CO₂).

All values are clearly labelled as *estimates*. The methodology version (GLEC Framework v3) is displayed alongside results for traceability.

**API endpoint:**

```
POST /api/v1/scenarios/compare
```

Request body: array of scenario objects (2–10 items).

| Field           | Type   | Required | Description                        |
|-----------------|--------|----------|------------------------------------|
| `vehicleId`     | UUID   | yes      | Existing vehicle from the fleet    |
| `origin`        | string | yes      | Origin city/location               |
| `destination`   | string | yes      | Destination city/location          |
| `distanceKm`    | number | yes      | Route distance in kilometres (>0)  |
| `payloadTons`   | number | yes      | Cargo weight in metric tons (>0)   |
| `transportMode` | enum   | yes      | `ROAD`, `RAIL`, `SEA`, or `AIR`   |
| `label`         | string | no       | Human-readable scenario name       |

Response includes per-scenario CO₂ estimates, the index of the preferred (greenest) scenario, and the methodology version.

### Live Map

Real-time map view of active shipments with route overlays and carbon output widgets.

### Analytics Dashboard

Charts for emission trends, fleet efficiency, and sustainability KPIs.

## Project Structure

```
backend/
  src/main/java/com/ecotrack/
    controller/     # REST controllers
    dto/            # Request/response DTOs
    model/          # JPA entities
    repository/     # Spring Data repositories
    service/        # Business logic
  src/test/java/    # Unit and integration tests
frontend/
  src/
    api/            # Axios API clients
    components/     # Reusable UI components
    pages/          # Route-level page components
scripts/
  start-dev.sh      # One-command dev environment
```

## Running Tests

**Backend:**

```bash
cd backend
mvn test
```

**Frontend:**

```bash
cd frontend
npm run lint
```

## License

Proprietary — internal use only.
