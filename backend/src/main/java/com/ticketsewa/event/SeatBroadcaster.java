package com.ticketsewa.event;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * Tiny in-memory SSE fan-out for live seat availability.
 * Single-instance scope is fine for a portfolio demo; a Redis pub/sub
 * would replace this in a multi-instance deployment.
 */
@Service
public class SeatBroadcaster {
  private final Map<Long, CopyOnWriteArrayList<SseEmitter>> subs = new ConcurrentHashMap<>();

  public SseEmitter subscribe(Long eventId) {
    SseEmitter emitter = new SseEmitter(60_000L);
    subs.computeIfAbsent(eventId, k -> new CopyOnWriteArrayList<>()).add(emitter);
    emitter.onCompletion(() -> remove(eventId, emitter));
    emitter.onTimeout(() -> remove(eventId, emitter));
    return emitter;
  }

  public void broadcast(Long eventId, List<EventService.TierDto> tiers) {
    var list = subs.getOrDefault(eventId, new CopyOnWriteArrayList<>());
    for (SseEmitter e : list) {
      try {
        e.send(tiers, MediaType.APPLICATION_JSON);
      } catch (IOException | IllegalStateException ex) {
        remove(eventId, e);
      }
    }
  }

  private void remove(Long eventId, SseEmitter emitter) {
    var list = subs.get(eventId);
    if (list != null) list.remove(emitter);
  }
}
