package com.ecotrack.repository;

import com.ecotrack.model.Vehicle;
import com.ecotrack.model.enums.FuelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    List<Vehicle> findByFuelType(FuelType fuelType);
    boolean existsByVin(String vin);
}
