## EcoTrack

EcoTrack is a logistics emissions application with a Spring Boot backend and a React/Vite frontend. It tracks shipments, vehicles, and calculated CO2 output, and now includes a pre-shipment scenario comparison flow in Shipment Hub.

### Repository layout

- `backend/` - Spring Boot API, shipment domain, emissions calculation services
- `frontend/` - React/Vite UI
- `docs/` - project documentation and feature notes
- `.softi/` - workflow runtime, artifacts, and project automation metadata

### Run locally

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### Verification notes

- Backend `pom.xml` targets Java 17.
- Review handoff for Green Route Advisor v1 still lists two blockers before merge-ready status:
  - malformed `transportMode` and `vehicleId` comparison inputs are not yet normalized into the feature's user-displayable 400 error contract
  - backend automated verification still needs to be rerun on a Java 17-compatible toolchain because the current Java 21 environment fails during Lombok compilation

### Feature docs

- `docs/green-route-advisor-v1.md` - scope, API shape, UI entry point, and current verification status for pre-shipment scenario comparison
