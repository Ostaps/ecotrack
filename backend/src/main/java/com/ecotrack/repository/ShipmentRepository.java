package com.ecotrack.repository;

import com.ecotrack.model.Shipment;
import com.ecotrack.model.enums.ShipmentStatus;
import com.ecotrack.model.enums.TransportMode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {

    Page<Shipment> findByStatus(ShipmentStatus status, Pageable pageable);

    Page<Shipment> findByOriginContainingIgnoreCase(String origin, Pageable pageable);

    @Query("SELECT s FROM Shipment s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:origin IS NULL OR LOWER(s.origin) LIKE LOWER(CONCAT('%', :origin, '%'))) AND " +
           "(:dateFrom IS NULL OR s.createdAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR s.createdAt <= :dateTo) AND " +
           "(:maxCo2 IS NULL OR s.calculatedCo2 <= :maxCo2)")
    Page<Shipment> findWithFilters(
            @Param("status") ShipmentStatus status,
            @Param("origin") String origin,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            @Param("maxCo2") Double maxCo2,
            Pageable pageable
    );

    List<Shipment> findByStatusNot(ShipmentStatus status);

    @Query("SELECT COALESCE(SUM(s.calculatedCo2), 0) FROM Shipment s")
    Double sumAllCo2();

    @Query("SELECT COALESCE(SUM(s.distanceKm), 0) FROM Shipment s")
    Double sumAllDistance();

    @Query("SELECT COALESCE(SUM(s.payloadTons), 0) FROM Shipment s")
    Double sumAllPayload();

    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.status = 'IN_TRANSIT'")
    Long countInTransit();

    @Query("SELECT s.transportMode, COALESCE(SUM(s.calculatedCo2), 0) FROM Shipment s GROUP BY s.transportMode")
    List<Object[]> sumCo2ByTransportMode();

    @Query("SELECT s.origin, s.destination, COALESCE(SUM(s.calculatedCo2), 0), COUNT(s) " +
           "FROM Shipment s GROUP BY s.origin, s.destination ORDER BY SUM(s.calculatedCo2) DESC")
    List<Object[]> findTopPollutingRoutes(Pageable pageable);

    @Query("SELECT FUNCTION('YEAR', s.createdAt), FUNCTION('MONTH', s.createdAt), COALESCE(SUM(s.calculatedCo2), 0) " +
           "FROM Shipment s WHERE s.createdAt >= :since GROUP BY FUNCTION('YEAR', s.createdAt), FUNCTION('MONTH', s.createdAt) " +
           "ORDER BY FUNCTION('YEAR', s.createdAt), FUNCTION('MONTH', s.createdAt)")
    List<Object[]> findMonthlyEmissions(@Param("since") LocalDateTime since);

    List<Shipment> findByVehicleId(UUID vehicleId);
}
