package com.ticketsewa.order;

/**
 * Lifecycle of a purchase order. An order is {@code PENDING} from seat
 * reservation until eSewa settles it: {@code PAID} on verified success,
 * {@code FAILED} when the gateway or verification rejects it, {@code EXPIRED}
 * when the reservation times out. Reserved seats are released for every
 * terminal state except {@code PAID}.
 */
public enum OrderStatus {
  /** Seats reserved, awaiting eSewa callback. */
  PENDING,
  /** eSewa verification succeeded; tickets issued. */
  PAID,
  /** eSewa reported failure or verification failed; seats released. */
  FAILED,
  /** Reservation timed out before payment; seats released. */
  EXPIRED
}
