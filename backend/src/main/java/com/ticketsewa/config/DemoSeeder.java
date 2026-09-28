package com.ticketsewa.config;

import com.ticketsewa.event.Event;
import com.ticketsewa.event.EventRepository;
import com.ticketsewa.event.EventStatus;
import com.ticketsewa.event.TicketTier;
import com.ticketsewa.event.TicketTierRepository;
import com.ticketsewa.user.Role;
import com.ticketsewa.user.User;
import com.ticketsewa.user.UserRepository;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

/** Seeds a demo organizer, attendee and two events on first boot. */
@Configuration
public class DemoSeeder {
  private static final Logger log = LoggerFactory.getLogger(DemoSeeder.class);

  @Bean
  @Profile("!test")
  CommandLineRunner seed(@Value("${app.seed-demo}") boolean seedDemo,
                         UserRepository users, EventRepository events,
                         TicketTierRepository tiers, PasswordEncoder encoder) {
    return args -> {
      if (!seedDemo || users.count() > 0) return;

      User org = users.save(User.builder().name("Sagar Events").email("organizer@demo.np")
          .passwordHash(encoder.encode("organizer123")).role(Role.ORGANIZER).build());
      users.save(User.builder().name("Demo Fan").email("fan@demo.np")
          .passwordHash(encoder.encode("fan12345")).role(Role.ATTENDEE).build());
      users.save(User.builder().name("Site Admin").email("admin@demo.np")
          .passwordHash(encoder.encode("admin12345")).role(Role.ADMIN).build());

      Event e1 = events.save(Event.builder().organizer(org)
          .title("Himalayan Beats: Live in Lalitpur")
          .description("An open-air night of Nepali indie, folk fusion and electronic sets under the winter sky. Gates open 4 PM.")
          .venue("Patan Durbar Square").city("Lalitpur")
          .startsAt(LocalDateTime.now().plusDays(21).withHour(17).withMinute(0))
          .endsAt(LocalDateTime.now().plusDays(21).withHour(22).withMinute(0))
          .status(EventStatus.PUBLISHED).build());
      tiers.saveAll(List.of(
          tier(e1, "General", 800, 500),
          tier(e1, "Fan Zone", 1500, 200),
          tier(e1, "VIP Deck", 3500, 50)));

      Event e2 = events.save(Event.builder().organizer(org)
          .title("Kathmandu Tech Summit 2026")
          .description("Two days of talks and workshops on backend engineering, IoT and AI — with a builder showcase on day two.")
          .venue("Nepal Academy Hall").city("Kathmandu")
          .startsAt(LocalDateTime.now().plusDays(45).withHour(9).withMinute(0))
          .endsAt(LocalDateTime.now().plusDays(46).withHour(18).withMinute(0))
          .status(EventStatus.PUBLISHED).build());
      tiers.saveAll(List.of(
          tier(e2, "Student", 500, 300),
          tier(e2, "Professional", 2500, 400),
          tier(e2, "Workshop + Conference", 5000, 100)));

      log.info("Demo data seeded: organizer@demo.np / organizer123, fan@demo.np / fan12345");
    };
  }

  private TicketTier tier(Event e, String name, int price, int qty) {
    return TicketTier.builder().event(e).name(name).priceNpr(price).quantityTotal(qty).build();
  }
}
