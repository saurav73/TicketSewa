package com.ticketsewa.ticket;

import com.ticketsewa.common.ApiException;
import com.ticketsewa.order.PurchaseOrder;
import com.ticketsewa.security.CustomUserDetailsService;
import com.ticketsewa.user.Role;
import com.ticketsewa.user.User;
import org.slf4j.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

@Service
public class TicketService {
  private static final Logger log = LoggerFactory.getLogger(TicketService.class);
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  private final TicketRepository tickets;
  private final QrCodeService qr;
  private final CustomUserDetailsService userDetails;

  public TicketService(TicketRepository tickets, QrCodeService qr, CustomUserDetailsService userDetails) {
    this.tickets = tickets;
    this.qr = qr;
    this.userDetails = userDetails;
  }

  public record TicketDto(Long id, String code, String eventTitle, String tierName,
                          String venue, String city, String startsAt, String status) {
    static TicketDto of(Ticket t) {
      return new TicketDto(t.getId(), t.getCode(), t.getEvent().getTitle(), t.getTier().getName(),
          t.getEvent().getVenue(), t.getEvent().getCity(),
          t.getEvent().getStartsAt().toString(), t.getStatus().name());
    }
  }

  /** Issues one ticket per unit in a PAID order. Called once per order. */
  @Transactional
  public List<Ticket> issueTickets(PurchaseOrder order) {
    var issued = new ArrayList<Ticket>();
    for (int i = 0; i < order.getQuantity(); i++) {
      issued.add(tickets.save(Ticket.builder()
          .order(order).holder(order.getUser())
          .event(order.getEvent()).tier(order.getTier())
          .code(newCode()).build()));
    }
    log.info("Issued {} tickets for order {}", issued.size(), order.getId());
    return issued;
  }

  public List<TicketDto> myTickets(String email) {
    User u = userDetails.loadDomainUser(email);
    return tickets.findByHolderIdOrderByCreatedAtDesc(u.getId()).stream().map(TicketDto::of).toList();
  }

  public byte[] qrPng(String email, Long ticketId) {
    User u = userDetails.loadDomainUser(email);
    Ticket t = tickets.findById(ticketId).orElseThrow(() -> ApiException.notFound("Ticket not found"));
    if (!t.getHolder().getId().equals(u.getId()) && u.getRole() != Role.ADMIN)
      throw ApiException.forbidden("Not your ticket");
    return qr.png("TICKETSEWA:" + t.getCode());
  }

  public record CheckinResult(String code, String eventTitle, String tierName,
                              String holderName, String status, String message) {}

  /**
   * Gate check-in. Only the event's organizer (or admin) may scan.
   * The atomic VALID->USED flip guarantees a ticket is admitted once,
   * even if two gates scan it at the same instant.
   */
  @Transactional
  public CheckinResult checkIn(String email, String code) {
    User me = userDetails.loadDomainUser(email);
    Ticket t = tickets.findByCode(code.trim().toUpperCase())
        .orElseThrow(() -> ApiException.notFound("Unknown ticket code"));
    boolean ownsEvent = t.getEvent().getOrganizer().getId().equals(me.getId());
    if (!ownsEvent && me.getRole() != Role.ADMIN)
      throw ApiException.forbidden("Only the event organizer can check in tickets");
    if (t.getStatus() == TicketStatus.USED)
      return new CheckinResult(t.getCode(), t.getEvent().getTitle(), t.getTier().getName(),
          t.getHolder().getName(), "ALREADY_USED", "Ticket was already used");
    if (t.getStatus() != TicketStatus.VALID)
      return new CheckinResult(t.getCode(), t.getEvent().getTitle(), t.getTier().getName(),
          t.getHolder().getName(), t.getStatus().name(), "Ticket is not valid");

    int updated = tickets.checkIn(t.getCode(), TicketStatus.VALID, TicketStatus.USED, java.time.Instant.now());
    if (updated == 0)
      return new CheckinResult(t.getCode(), t.getEvent().getTitle(), t.getTier().getName(),
          t.getHolder().getName(), "ALREADY_USED", "Ticket was just used at another gate");
    log.info("Checked in ticket {} by {}", t.getCode(), email);
    return new CheckinResult(t.getCode(), t.getEvent().getTitle(), t.getTier().getName(),
        t.getHolder().getName(), "ADMITTED", "Welcome in!");
  }

  private String newCode() {
    var sb = new StringBuilder("TS-");
    for (int i = 0; i < 8; i++) sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
    return sb.toString();
  }
}
