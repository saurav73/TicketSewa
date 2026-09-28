package com.ticketsewa.payment;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "esewa")
@Getter @Setter
public class EsewaProperties {
  /** Merchant code (scd). EPAYTEST works on UAT. */
  private String merchantCode;
  private String paymentUrl;
  private String verificationUrl;
  private String successUrl;
  private String failureUrl;
  /** When true, /api/payments/demo/pay simulates a successful eSewa callback. */
  private boolean demoMode;
}
