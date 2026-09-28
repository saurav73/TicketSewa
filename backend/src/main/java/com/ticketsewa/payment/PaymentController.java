package com.ticketsewa.payment;

import com.ticketsewa.order.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
  private final OrderService orders;
  private final EsewaProperties props;

  public PaymentController(OrderService orders, EsewaProperties props) {
    this.orders = orders;
    this.props = props;
  }

  /**
   * Verifies an eSewa success redirect. The SPA lands on /payment/success
   * with ?oid=&amt=&refId= and POSTs them here. Tickets are issued only
   * after the server-to-server transrec check passes.
   */
  @PostMapping("/verify")
  public ResponseEntity<OrderService.OrderDto> verify(@AuthenticationPrincipal UserDetails me,
                                                     @Valid @RequestBody OrderService.VerifyRequest req) {
    return ResponseEntity.ok(orders.verifyPayment(me.getUsername(), req));
  }

  /** Buyer hit eSewa's failure URL: release the held seats. */
  @PostMapping("/failed")
  public ResponseEntity<Void> failed(@AuthenticationPrincipal UserDetails me,
                                     @RequestBody Map<String, String> body) {
    orders.markFailedByBuyer(me.getUsername(), body.get("oid"));
    return ResponseEntity.ok().build();
  }

  /**
   * Demo-mode one-click payment. Simulates the full eSewa round-trip so the
   * app is demoable without merchant credentials. Disabled in production
   * via esewa.demo-mode=false.
   */
  @PostMapping("/demo/pay")
  public ResponseEntity<OrderService.OrderDto> demoPay(@AuthenticationPrincipal UserDetails me,
                                                      @RequestBody Map<String, String> body) {
    return ResponseEntity.ok(orders.demoPay(me.getUsername(), body.get("orderId"), props));
  }

  @GetMapping("/demo/enabled")
  public Map<String, Boolean> demoEnabled() {
    return Map.of("demoMode", props.isDemoMode());
  }
}
