package com.ticketsewa;

import com.ticketsewa.event.*;
import com.ticketsewa.user.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 20 buyers race for 50 seats, 5 at a time. The atomic conditional UPDATE
 * must let exactly 10 through and leave quantitySold == 50 — never 55.
 */
@SpringBootTest
class InventoryRaceTest {
  @Autowired TicketTierRepository tiers;
  @Autowired EventRepository events;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder encoder;
  @Autowired TransactionTemplate tx;

  private TicketTier tier;

  @BeforeEach
  void setup() {
    User org = users.save(User.builder().name("Org").email("org@t.np")
        .passwordHash(encoder.encode("password")).role(Role.ORGANIZER).build());
    Event e = events.save(Event.builder().organizer(org).title("Race Night")
        .venue("V").city("C").startsAt(LocalDateTime.now().plusDays(3))
        .status(EventStatus.PUBLISHED).build());
    tier = tiers.save(TicketTier.builder().event(e).name("General")
        .priceNpr(100).quantityTotal(50).build());
  }

  @Test
  void concurrentReservationsNeverOversell() throws Exception {
    int threads = 20, perBuyer = 5;
    var start = new CountDownLatch(1);
    var done = new CountDownLatch(threads);
    var successes = new AtomicInteger();
    var pool = Executors.newFixedThreadPool(threads);

    for (int i = 0; i < threads; i++) {
      pool.submit(() -> {
        try {
          start.await();
          Boolean ok = tx.execute(s ->
              tiers.reserveSeats(tier.getId(), perBuyer) == 1);
          if (Boolean.TRUE.equals(ok)) successes.incrementAndGet();
        } catch (Exception ignored) {
        } finally {
          done.countDown();
        }
      });
    }
    start.countDown();
    assertTrue(done.await(30, TimeUnit.SECONDS));
    pool.shutdown();

    assertEquals(10, successes.get(), "exactly 10 of 20 buyers should get seats");
    TicketTier fresh = tx.execute(s -> tiers.findById(tier.getId()).orElseThrow());
    assertEquals(50, fresh.getQuantitySold(), "sold must equal capacity, never more");
  }
}
