package com.ecotrack.repository;

import com.ecotrack.model.EmissionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface EmissionLogRepository extends JpaRepository<EmissionLog, UUID> {
    List<EmissionLog> findByShipmentId(UUID shipmentId);
    List<EmissionLog> findByShipmentVehicleId(UUID vehicleId);
}
