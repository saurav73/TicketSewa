package com.ticketsewa.event;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;

import java.util.List;

/**
 * Persistence access for {@link Event}s: paged lookup of published events for
 * the browse pages, and an organizer-scoped list for their dashboard.
 */
public interface EventRepository extends JpaRepository<Event, Long> {
  Page<Event> findByStatusOrderByStartsAtAsc(EventStatus status, Pageable pageable);
  List<Event> findByOrganizerIdOrderByStartsAtDesc(Long organizerId);
}
