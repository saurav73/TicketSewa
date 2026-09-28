package com.ticketsewa.ticket;

import com.ticketsewa.event.Event;
import com.ticketsewa.event.TicketTier;
import com.ticketsewa.order.PurchaseOrder;
import com.ticketsewa.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "tickets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ticket {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id")
  private PurchaseOrder order;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id")
  private User holder;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "event_id")
  private Event event;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "tier_id")
  private TicketTier tier;

  /** Public ticket code, e.g. TS-7KQ2M9XA. Unique: the check-in lookup key. */
  @Column(nullable = false, unique = true)
  private String code;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private TicketStatus status = TicketStatus.VALID;

  private Instant usedAt;

  @CreationTimestamp
  @Column(updatable = false)
  private Instant createdAt;
}
