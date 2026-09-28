package com.ticketsewa.order;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class CheckoutController {
  private final OrderService orders;

  public CheckoutController(OrderService orders) {
    this.orders = orders;
  }

  @PostMapping
  public ResponseEntity<OrderService.OrderDto> create(@AuthenticationPrincipal UserDetails me,
                                                     @Valid @RequestBody OrderService.CreateOrderRequest req) {
    return ResponseEntity.ok(orders.createOrder(me.getUsername(), req));
  }

  @GetMapping("/mine")
  public List<OrderService.OrderDto> mine(@AuthenticationPrincipal UserDetails me) {
    return orders.myOrders(me.getUsername());
  }

  @GetMapping("/{id}")
  public OrderService.OrderDto get(@AuthenticationPrincipal UserDetails me, @PathVariable String id) {
    return orders.get(me.getUsername(), id);
  }

  @PostMapping("/{id}/payment-form")
  public ResponseEntity<?> paymentForm(@AuthenticationPrincipal UserDetails me, @PathVariable String id) {
    return ResponseEntity.ok(orders.paymentForm(me.getUsername(), id));
  }
}
