package com.ticketsewa.event;

import jakarta.persistence.*;
import lombok.*;

/**
 * A ticket tier (e.g. General, VIP) of an event.
 *
 * Seat inventory is guarded by an atomic conditional UPDATE
 * (see {@link TicketTierRepository#reserveSeats}); quantitySold can never
 * exceed quantityTotal even under concurrent purchase attempts.
 */
@Entity
@Table(name = "ticket_tiers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TicketTier {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "event_id")
  private Event event;

  @Column(nullable = false)
  private String name;

  /** Price in NPR (whole rupees). */
  @Column(nullable = false)
  private int priceNpr;

  @Column(nullable = false)
  private int quantityTotal;

  @Column(nullable = false)
  @Builder.Default
  private int quantitySold = 0;

  @Version
  private Long version;

  @Transient
  public int getRemaining() {
    return Math.max(0, quantityTotal - quantitySold);
  }
}
