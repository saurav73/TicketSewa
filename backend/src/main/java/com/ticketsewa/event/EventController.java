package com.ticketsewa.event;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api")
public class EventController {
  private final EventService service;

  public EventController(EventService service) {
    this.service = service;
  }

  /** Public event listing. */
  @GetMapping("/events")
  public Page<EventService.EventDto> list(@PageableDefault(size = 12) Pageable pageable) {
    return service.published(pageable);
  }

  /** Public event detail. */
  @GetMapping("/events/{id}")
  public EventService.EventDto get(@PathVariable Long id) {
    return service.getPublished(id);
  }

  /** Live seat availability stream (Server-Sent Events). */
  @GetMapping("/events/{id}/seats/stream")
  public SseEmitter streamSeats(@PathVariable Long id) {
    return service.subscribeSeats(id);
  }

  /** Organizer: create an event with tiers. */
  @PostMapping("/organizer/events")
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
  public EventService.EventDto create(@AuthenticationPrincipal UserDetails me,
                                      @Valid @RequestBody EventService.CreateEventRequest req) {
    return service.create(me.getUsername(), req);
  }

  /** Organizer: my events. */
  @GetMapping("/organizer/events")
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
  public List<EventService.EventDto> mine(@AuthenticationPrincipal UserDetails me) {
    return service.myEvents(me.getUsername());
  }

  /** Organizer: cancel an event. */
  @PostMapping("/organizer/events/{id}/cancel")
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
  public ResponseEntity<Void> cancel(@AuthenticationPrincipal UserDetails me, @PathVariable Long id) {
    service.cancel(me.getUsername(), id);
    return ResponseEntity.ok().build();
  }
}
