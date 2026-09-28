package com.ticketsewa.event;

import com.ticketsewa.common.ApiException;
import com.ticketsewa.security.CustomUserDetailsService;
import com.ticketsewa.user.User;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EventService {
  private final EventRepository events;
  private final TicketTierRepository tiers;
  private final CustomUserDetailsService userDetails;
  private final SeatBroadcaster seats;

  public EventService(EventRepository events, TicketTierRepository tiers,
                      CustomUserDetailsService userDetails, SeatBroadcaster seats) {
    this.events = events;
    this.tiers = tiers;
    this.userDetails = userDetails;
    this.seats = seats;
  }

  public record TierInput(@NotBlank String name, @Min(0) int priceNpr, @Min(1) int quantity) {}
  public record CreateEventRequest(
      @NotBlank String title, String description,
      @NotBlank String venue, @NotBlank String city,
      @NotNull LocalDateTime startsAt, LocalDateTime endsAt,
      String bannerUrl, @Size(min = 1) List<TierInput> tiers) {}

  public record TierDto(Long id, String name, int priceNpr, int quantityTotal, int quantitySold, int remaining) {
    static TierDto of(TicketTier t) {
      return new TierDto(t.getId(), t.getName(), t.getPriceNpr(), t.getQuantityTotal(), t.getQuantitySold(), t.getRemaining());
    }
  }
  public record EventDto(Long id, String title, String description, String venue, String city,
                         LocalDateTime startsAt, LocalDateTime endsAt, String bannerUrl,
                         String status, String organizerName, List<TierDto> tiers) {
    static EventDto of(Event e, List<TierDto> tiers) {
      return new EventDto(e.getId(), e.getTitle(), e.getDescription(), e.getVenue(), e.getCity(),
          e.getStartsAt(), e.getEndsAt(), e.getBannerUrl(), e.getStatus().name(),
          e.getOrganizer().getName(), tiers);
    }
  }

  public Page<EventDto> published(Pageable pageable) {
    return events.findByStatusOrderByStartsAtAsc(EventStatus.PUBLISHED, pageable)
        .map(e -> EventDto.of(e, tiers.findByEventIdOrderByPriceNprAsc(e.getId()).stream().map(TierDto::of).toList()));
  }

  public EventDto getPublished(Long id) {
    Event e = events.findById(id).orElseThrow(() -> ApiException.notFound("Event not found"));
    if (e.getStatus() != EventStatus.PUBLISHED) throw ApiException.notFound("Event not found");
    return EventDto.of(e, tiers.findByEventIdOrderByPriceNprAsc(id).stream().map(TierDto::of).toList());
  }

  @Transactional
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
  public EventDto create(String email, CreateEventRequest req) {
    User org = userDetails.loadDomainUser(email);
    if (req.startsAt().isBefore(LocalDateTime.now()))
      throw ApiException.badRequest("Event must start in the future");
    Event e = events.save(Event.builder()
        .organizer(org).title(req.title().trim()).description(req.description())
        .venue(req.venue().trim()).city(req.city().trim())
        .startsAt(req.startsAt()).endsAt(req.endsAt())
        .bannerUrl(req.bannerUrl()).status(EventStatus.PUBLISHED).build());
    List<TierDto> dtos = req.tiers().stream()
        .map(t -> tiers.save(TicketTier.builder().event(e)
            .name(t.name().trim()).priceNpr(t.priceNpr()).quantityTotal(t.quantity()).build()))
        .map(TierDto::of).toList();
    return EventDto.of(e, dtos);
  }

  @Transactional
  @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
  public void cancel(String email, Long id) {
    Event e = events.findById(id).orElseThrow(() -> ApiException.notFound("Event not found"));
    User me = userDetails.loadDomainUser(email);
    if (me.getRole() != com.ticketsewa.user.Role.ADMIN && !e.getOrganizer().getId().equals(me.getId()))
      throw ApiException.forbidden("Not your event");
    e.setStatus(EventStatus.CANCELLED);
  }

  public List<EventDto> myEvents(String email) {
    User me = userDetails.loadDomainUser(email);
    return events.findByOrganizerIdOrderByStartsAtDesc(me.getId()).stream()
        .map(e -> EventDto.of(e, tiers.findByEventIdOrderByPriceNprAsc(e.getId()).stream().map(TierDto::of).toList()))
        .toList();
  }

  /** Broadcast fresh seat counts after every reservation/release. */
  public void broadcastSeats(Long eventId) {
    var dtos = tiers.findByEventIdOrderByPriceNprAsc(eventId).stream().map(TierDto::of).toList();
    seats.broadcast(eventId, dtos);
  }

  public org.springframework.web.servlet.mvc.method.annotation.SseEmitter subscribeSeats(Long eventId) {
    // sanity: event must exist and be published
    getPublished(eventId);
    var emitter = seats.subscribe(eventId);
    // send current snapshot immediately so the client never waits
    broadcastSeats(eventId);
    return emitter;
  }
}
