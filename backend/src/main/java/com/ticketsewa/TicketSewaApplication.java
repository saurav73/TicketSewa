package com.ticketsewa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Bootstraps the TicketSewa API. Async execution backs non-blocking payment
 * callbacks and notifications; scheduling backs the stale-reservation expiry
 * job that releases unpaid seats.
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class TicketSewaApplication {
  public static void main(String[] args) {
    SpringApplication.run(TicketSewaApplication.class, args);
  }
}
