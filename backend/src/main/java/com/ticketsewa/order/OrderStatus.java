package com.ticketsewa.order;

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
