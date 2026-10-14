package com.ticketsewa.user;

/**
 * Account roles used for RBAC: {@code ATTENDEE} buys tickets, {@code ORGANIZER}
 * creates and manages their own events, and {@code ADMIN} can do both plus
 * platform-level administration.
 */
public enum Role {
  ATTENDEE,
  ORGANIZER,
  ADMIN
}
