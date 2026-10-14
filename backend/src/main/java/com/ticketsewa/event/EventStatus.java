package com.ticketsewa.event;

/**
 * Lifecycle states of an {@link Event}: {@code DRAFT} is invisible to buyers,
 * {@code PUBLISHED} is on sale, and {@code CANCELLED} stops new orders.
 */
public enum EventStatus {
  DRAFT,
  PUBLISHED,
  CANCELLED
}
