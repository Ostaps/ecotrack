# EcoTrack

EcoTrack is a shipment sustainability platform with Spring Boot backend and React frontend.

## Structure

- `backend/` - Java Spring Boot API
- `frontend/` - React + Vite web app
- `.softi/` - workflow automation artifacts and governance context

## Key feature (May 2026)

Green Route Advisor v1 adds pre-shipment scenario comparison:

- API endpoint: `POST /api/v1/shipments/compare-scenarios`
- Compare 2+ scenarios side by side using existing planning fields
- Preferred scenario selected by deterministic rule: `LOWEST_ESTIMATED_CO2E`
- Each scenario result includes estimated CO2 value and methodology metadata (`methodologyVersion`, `valueType`)
- UI support in Shipment Hub for estimated-value comparison flow

## Local setup

### Backend

1. `cd backend`
2. `mvn spring-boot:run`

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Security and secrets

- Use local `.env` only for development secrets.
- `.env` is git-ignored; commit only `.env.example` placeholders.
- If a secret is exposed in git history or staged files, rotate/revoke it immediately.
