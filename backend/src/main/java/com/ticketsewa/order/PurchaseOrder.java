package com.ticketsewa.order;

import com.ticketsewa.event.Event;
import com.ticketsewa.event.TicketTier;
import com.ticketsewa.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "purchase_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrder {
  /**
   * UUID string. Doubles as eSewa's {@code pid} (product identity code),
   * so the payment round-trip needs no extra mapping table.
   */
  @Id
  @Builder.Default
  private String id = UUID.randomUUID().toString();

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id")
  private User user;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "event_id")
  private Event event;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "tier_id")
  private TicketTier tier;

  @Column(nullable = false)
  private int quantity;

  /** Total in NPR (whole rupees). */
  @Column(nullable = false)
  private int amountNpr;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private OrderStatus status = OrderStatus.PENDING;

  /** eSewa's transaction reference id, set on successful verification. Unique: replays are rejected. */
  @Column(unique = true)
  private String esewaRefId;

  /** Client-supplied idempotency key: double-clicks / retries create one order, not two. */
  @Column(unique = true)
  private String idempotencyKey;

  @CreationTimestamp
  @Column(updatable = false)
  private Instant createdAt;

  private Instant paidAt;
}
