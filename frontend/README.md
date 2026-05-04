# EcoTrack Frontend

React/Vite application for the EcoTrack UI.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Key areas

- `src/pages/ShipmentHub.jsx` - shipment table, create shipment flow, and Green Route Advisor scenario comparison modal
- `src/api/shipments.js` - shipment and scenario comparison API client calls

## Notes

- The compare flow posts to `POST /api/v1/shipments/scenario-comparisons`.
- Current feature status and verification caveats are documented in `../docs/green-route-advisor-v1.md`.
