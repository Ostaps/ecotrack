package com.ecotrack.model;

import com.ecotrack.model.enums.ShipmentStatus;
import com.ecotrack.model.enums.TransportMode;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shipment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String trackingId;

    private String origin;
    private String destination;
    private Double distanceKm;
    private Double payloadTons;

    /** Calculated and persisted by EmissionCalculatorService on creation */
    private Double calculatedCo2;

    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;

    @Enumerated(EnumType.STRING)
    private TransportMode transportMode;

    private Double originLat;
    private Double originLon;
    private Double destinationLat;
    private Double destinationLon;

    private LocalDateTime createdAt;
    private LocalDateTime estimatedArrival;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
}
