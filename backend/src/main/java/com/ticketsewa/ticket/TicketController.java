package com.ticketsewa.ticket;

import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TicketController {
  private final TicketService tickets;

  public TicketController(TicketService tickets) {
    this.tickets = tickets;
  }

  @GetMapping("/tickets/mine")
  public List<TicketService.TicketDto> mine(@AuthenticationPrincipal UserDetails me) {
    return tickets.myTickets(me.getUsername());
  }

  @GetMapping("/tickets/{id}/qr")
  public ResponseEntity<byte[]> qr(@AuthenticationPrincipal UserDetails me, @PathVariable Long id) {
    return ResponseEntity.ok()
        .contentType(MediaType.IMAGE_PNG)
        .body(tickets.qrPng(me.getUsername(), id));
  }

  /** Gate check-in: scan (or type) a ticket code. Organizer of the event only. */
  @PostMapping("/checkin")
  public TicketService.CheckinResult checkIn(@AuthenticationPrincipal UserDetails me,
                                            @RequestBody Map<String, String> body) {
    return tickets.checkIn(me.getUsername(), body.get("code"));
  }
}
