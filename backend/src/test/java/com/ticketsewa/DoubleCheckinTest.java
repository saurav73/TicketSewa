package com.ticketsewa;

import com.ticketsewa.event.*;
import com.ticketsewa.order.*;
import com.ticketsewa.payment.EsewaProperties;
import com.ticketsewa.ticket.*;
import com.ticketsewa.user.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Two gates scanning the same QR at the same instant must admit it once:
 * one ADMITTED, one ALREADY_USED — never two ADMITTED.
 */
@SpringBootTest
class DoubleCheckinTest {
  @Autowired TicketService ticketService;
  @Autowired OrderService orders;
  @Autowired TicketRepository tickets;
  @Autowired TicketTierRepository tiers;
  @Autowired EventRepository events;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder encoder;
  @Autowired TransactionTemplate tx;
  @Autowired EsewaProperties esewaProps;

  private String code;

  @BeforeEach
  void setup() {
    User org = users.save(User.builder().name("Org").email("org3@t.np")
        .passwordHash(encoder.encode("password")).role(Role.ORGANIZER).build());
    users.save(User.builder().name("Fan").email("fan3@t.np")
        .passwordHash(encoder.encode("password")).role(Role.ATTENDEE).build());
    Event e = events.save(Event.builder().organizer(org).title("Gate Fest")
        .venue("V").city("C").startsAt(LocalDateTime.now().plusDays(3))
        .status(EventStatus.PUBLISHED).build());
    TicketTier tier = tiers.save(TicketTier.builder().event(e).name("General")
        .priceNpr(500).quantityTotal(100).build());
    var order = tx.execute(s -> orders.createOrder("fan3@t.np",
        new OrderService.CreateOrderRequest(e.getId(), tier.getId(), 1, "gate-key-1")));
    tx.execute(s -> {
      orders.demoPay("fan3@t.np", order.id(), esewaProps);
      return null;
    });
    List<Ticket> issued = tx.execute(s -> tickets.findByOrderId(order.id()));
    code = issued.get(0).getCode();
  }

  @Test
  void concurrentScansAdmitOnce() throws Exception {
    var pool = Executors.newFixedThreadPool(2);
    var f1 = pool.submit(() -> ticketService.checkIn("org3@t.np", code));
    var f2 = pool.submit(() -> ticketService.checkIn("org3@t.np", code));
    var r1 = f1.get(30, TimeUnit.SECONDS);
    var r2 = f2.get(30, TimeUnit.SECONDS);
    pool.shutdown();

    long admitted = List.of(r1, r2).stream().filter(r -> r.status().equals("ADMITTED")).count();
    assertEquals(1, admitted, "exactly one gate admits the ticket");
  }
}
