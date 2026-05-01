package com.ecotrack.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "emission_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmissionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    private Double carbonValue;

    /** JSON string with step-by-step calculation breakdown */
    @Column(length = 2000)
    private String calculationBreakdown;

    private LocalDateTime timestamp;
}
