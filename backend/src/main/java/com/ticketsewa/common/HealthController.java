package com.ticketsewa.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Unauthenticated liveness probe for the cloud host's health checks. */
@RestController
public class HealthController {
  /**
   * Returns a minimal liveness payload ({@code status: UP}) so the cloud
   * host can tell the API process is up without needing a database round-trip
   * or any credentials.
   */
  @GetMapping("/api/health")
  public Map<String, String> health() {
    return Map.of("status", "UP", "service", "ticketsewa");
  }
}
