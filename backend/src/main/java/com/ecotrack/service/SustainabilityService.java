package com.ecotrack.service;

import com.ecotrack.model.Shipment;
import com.ecotrack.model.Vehicle;
import com.ecotrack.model.enums.FuelType;
import org.springframework.stereotype.Service;

/**
 * Core emission calculation service per GLEC Framework v3.
 * Formula: E = D × W × EF × fuelMultiplier × penalties
 */
@Service
public class SustainabilityService {

    /**
     * Calculates CO2 emissions for a shipment using a 4-step formula.
     *
     * @param shipment the shipment containing distance and payload
     * @param vehicle  the vehicle containing CO2 factor and fuel type
     * @return final CO2 value in kg, rounded to 2 decimal places
     */
    public Double calculateEmissions(Shipment shipment, Vehicle vehicle) {
        // Step 1 — Base calculation: distance × payload × CO2 factor
        double base = shipment.getDistanceKm()
                    * shipment.getPayloadTons()
                    * vehicle.getCo2Factor();

        // Step 2 — Apply fuel type multiplier
        double fuelMultiplier = switch (vehicle.getFuelType()) {
            case ELECTRIC     -> 0.15;
            case HYDROGEN     -> 0.25;
            case DIESEL_EURO6 -> 1.0;
            case DIESEL_EURO5 -> 1.0;
        };
        double afterFuel = base * fuelMultiplier;

        // Step 3 — Long-haul penalty: +10% for routes > 1000 km
        double afterDistance = shipment.getDistanceKm() > 1000
                ? afterFuel * 1.1
                : afterFuel;

        // Step 4 — Euro 5 carbon tax: +25% for DIESEL_EURO5 vehicles
        double finalValue = vehicle.getFuelType() == FuelType.DIESEL_EURO5
                ? afterDistance * 1.25
                : afterDistance;

        return Math.round(finalValue * 100.0) / 100.0;
    }

    /**
     * Builds a human-readable JSON breakdown string for EmissionLog storage.
     */
    public String buildBreakdown(Shipment shipment, Vehicle vehicle) {
        double base = shipment.getDistanceKm() * shipment.getPayloadTons() * vehicle.getCo2Factor();
        double fuelMultiplier = switch (vehicle.getFuelType()) {
            case ELECTRIC     -> 0.15;
            case HYDROGEN     -> 0.25;
            case DIESEL_EURO6 -> 1.0;
            case DIESEL_EURO5 -> 1.0;
        };
        double afterFuel = base * fuelMultiplier;
        boolean longHaul = shipment.getDistanceKm() > 1000;
        double afterDistance = longHaul ? afterFuel * 1.1 : afterFuel;
        boolean euro5Tax = vehicle.getFuelType() == FuelType.DIESEL_EURO5;
        double finalValue = euro5Tax ? afterDistance * 1.25 : afterDistance;

        return String.format(
            "{\"step1_base\":%.2f,\"step2_fuelMultiplier\":%s,\"step2_afterFuel\":%.2f," +
            "\"step3_longHaulPenalty\":%s,\"step3_afterPenalty\":%.2f," +
            "\"step4_euro5Tax\":%s,\"step4_final\":%.2f," +
            "\"formula\":\"E = D(%.1f) × W(%.1f) × EF(%.4f) × fuel(%s) × haul(%s) × tax(%s)\"}",
            base,
            fuelMultiplier,
            afterFuel,
            longHaul ? "1.1" : "none",
            afterDistance,
            euro5Tax ? "1.25" : "none",
            finalValue,
            shipment.getDistanceKm(),
            shipment.getPayloadTons(),
            vehicle.getCo2Factor(),
            fuelMultiplier,
            longHaul ? "1.1x" : "1.0x",
            euro5Tax ? "1.25x" : "1.0x"
        );
    }
}
