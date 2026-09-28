package com.ticketsewa.event;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
  Page<Event> findByStatusOrderByStartsAtAsc(EventStatus status, Pageable pageable);
  List<Event> findByOrganizerIdOrderByStartsAtDesc(Long organizerId);
}
