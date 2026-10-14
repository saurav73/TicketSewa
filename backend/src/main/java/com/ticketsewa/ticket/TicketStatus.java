package com.ticketsewa.ticket;

/**
 * Lifecycle of a ticket: {@code VALID} can still be checked in, {@code USED}
 * has been scanned at the gate (the VALID to USED flip is atomic, so each
 * ticket can only enter once), and {@code REFUNDED} is no longer valid.
 */
public enum TicketStatus {
  VALID,
  USED,
  REFUNDED
}
