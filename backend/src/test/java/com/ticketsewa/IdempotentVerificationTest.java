package com.ticketsewa;

import com.ticketsewa.event.*;
import com.ticketsewa.order.*;
import com.ticketsewa.payment.EsewaService;
import com.ticketsewa.ticket.*;
import com.ticketsewa.user.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * eSewa sometimes delivers the success callback twice. Verifying the same
 * order concurrently must still issue exactly one set of tickets and leave
 * the order PAID exactly once.
 */
@SpringBootTest
class IdempotentVerificationTest {
  @Autowired OrderService orders;
  @Autowired TicketRepository tickets;
  @Autowired TicketTierRepository tiers;
  @Autowired EventRepository events;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder encoder;
  @Autowired TransactionTemplate tx;

  @MockBean
  EsewaService esewa;

  private OrderService.OrderDto order;
  private String fanEmail;
  private String idemKey;

  @BeforeEach
  void setup() {
    when(esewa.verify(anyString(), anyString(), anyString())).thenReturn(true);
    String tag = UUID.randomUUID().toString().substring(0, 8);
    fanEmail = "fan-" + tag + "@t.np";
    User org = users.save(User.builder().name("Org").email("org-" + tag + "@t.np")
        .passwordHash(encoder.encode("password")).role(Role.ORGANIZER).build());
    User fan = users.save(User.builder().name("Fan").email(fanEmail)
        .passwordHash(encoder.encode("password")).role(Role.ATTENDEE).build());
    Event e = events.save(Event.builder().organizer(org).title("Idem Fest")
        .venue("V").city("C").startsAt(LocalDateTime.now().plusDays(3))
        .status(EventStatus.PUBLISHED).build());
    TicketTier tier = tiers.save(TicketTier.builder().event(e).name("General")
        .priceNpr(1000).quantityTotal(100).build());
    idemKey = "idem-key-" + tag;
    order = tx.execute(s -> orders.createOrder(fanEmail,
        new OrderService.CreateOrderRequest(e.getId(), tier.getId(), 2, idemKey)));
  }

  @Test
  void doubleCallbackIssuesTicketsOnce() throws Exception {
    var req = new OrderService.VerifyRequest(order.id(), String.valueOf(order.amountNpr()), "REF123");
    var pool = Executors.newFixedThreadPool(2);
    var f1 = pool.submit(() -> orders.verifyPayment(fanEmail, req));
    var f2 = pool.submit(() -> orders.verifyPayment(fanEmail, req));
    var r1 = f1.get(30, TimeUnit.SECONDS);
    var r2 = f2.get(30, TimeUnit.SECONDS);
    pool.shutdown();

    assertEquals("PAID", r1.status());
    assertEquals("PAID", r2.status());
    Long count = tx.execute(s -> (long) tickets.findByOrderId(order.id()).size());
    assertEquals(2, count, "exactly 2 tickets for a quantity-2 order, never 4");
  }

  @Test
  void doubleCreateWithSameIdempotencyKeyMakesOneOrder() {
    var req = new OrderService.CreateOrderRequest(order.eventId(), order.tierId(), 2, idemKey);
    var again = tx.execute(s -> orders.createOrder(fanEmail, req));
    assertEquals(order.id(), again.id(), "same idempotency key must return the original order");
  }
}
