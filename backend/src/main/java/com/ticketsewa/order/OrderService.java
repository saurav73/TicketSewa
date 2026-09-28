package com.ticketsewa.order;

import com.ticketsewa.common.ApiException;
import com.ticketsewa.event.*;
import com.ticketsewa.payment.EsewaProperties;
import com.ticketsewa.payment.EsewaService;
import com.ticketsewa.security.CustomUserDetailsService;
import com.ticketsewa.ticket.TicketService;
import com.ticketsewa.user.User;
import jakarta.validation.constraints.*;
import org.slf4j.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {
  private static final Logger log = LoggerFactory.getLogger(OrderService.class);
  private static final long RESERVATION_MINUTES = 30;

  private final PurchaseOrderRepository orders;
  private final TicketTierRepository tiers;
  private final EventRepository events;
  private final CustomUserDetailsService userDetails;
  private final EventService eventService;
  private final EsewaService esewa;
  private final TicketService tickets;
  private final PlatformTransactionManager txManager;

  public OrderService(PurchaseOrderRepository orders, TicketTierRepository tiers,
                      EventRepository events, CustomUserDetailsService userDetails,
                      EventService eventService, EsewaService esewa, TicketService tickets,
                      PlatformTransactionManager txManager) {
    this.orders = orders;
    this.tiers = tiers;
    this.events = events;
    this.userDetails = userDetails;
    this.eventService = eventService;
    this.esewa = esewa;
    this.tickets = tickets;
    this.txManager = txManager;
  }

  public record CreateOrderRequest(@NotNull Long eventId, @NotNull Long tierId,
                                   @Min(1) @Max(10) int quantity, String idempotencyKey) {}
  public record OrderDto(String id, Long eventId, String eventTitle, Long tierId, String tierName,
                         int quantity, int amountNpr, String status, Instant createdAt) {
    static OrderDto of(PurchaseOrder o) {
      return new OrderDto(o.getId(), o.getEvent().getId(), o.getEvent().getTitle(),
          o.getTier().getId(), o.getTier().getName(), o.getQuantity(),
          o.getAmountNpr(), o.getStatus().name(), o.getCreatedAt());
    }
  }
  public record VerifyRequest(@NotBlank String oid, @NotBlank String amt, @NotBlank String refId) {}

  /**
   * Creates a PENDING order and atomically reserves seats.
   * The idempotency key makes double-clicks and retried requests safe:
   * the same key returns the original order instead of creating another.
   */
  @Transactional
  public OrderDto createOrder(String email, CreateOrderRequest req) {
    if (req.idempotencyKey() != null && !req.idempotencyKey().isBlank()) {
      var existing = orders.findByIdempotencyKey(req.idempotencyKey());
      if (existing.isPresent()) return OrderDto.of(existing.get());
    }
    User user = userDetails.loadDomainUser(email);
    Event event = events.findById(req.eventId()).orElseThrow(() -> ApiException.notFound("Event not found"));
    if (event.getStatus() != EventStatus.PUBLISHED) throw ApiException.badRequest("Event is not on sale");
    TicketTier tier = tiers.findById(req.tierId()).orElseThrow(() -> ApiException.notFound("Ticket tier not found"));
    if (!tier.getEvent().getId().equals(event.getId())) throw ApiException.badRequest("Tier does not belong to this event");

    // Atomic conditional UPDATE: 1 = seats reserved, 0 = not enough left.
    if (tiers.reserveSeats(tier.getId(), req.quantity()) == 0)
      throw ApiException.conflict("Not enough seats left in this tier");

    try {
      PurchaseOrder order = orders.save(PurchaseOrder.builder()
          .user(user).event(event).tier(tier)
          .quantity(req.quantity())
          .amountNpr(tier.getPriceNpr() * req.quantity())
          .idempotencyKey(req.idempotencyKey() != null && !req.idempotencyKey().isBlank()
              ? req.idempotencyKey() : UUID.randomUUID().toString())
          .build());
      eventService.broadcastSeats(event.getId());
      log.info("Order {} created: {}x tier {} (reserved)", order.getId(), req.quantity(), tier.getId());
      return OrderDto.of(order);
    } catch (DataIntegrityViolationException e) {
      // Lost a race on the idempotency key: this transaction rolls back
      // (the seat reservation with it) and we return the winner's order
      // loaded in a fresh transaction.
      TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
      var freshTx = new TransactionTemplate(txManager);
      freshTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
      return freshTx.execute(s -> orders.findByIdempotencyKey(req.idempotencyKey())
          .map(OrderDto::of)
          .orElseThrow(() -> ApiException.conflict("Order already exists")));
    }
  }

  public Map<String, Object> paymentForm(String email, String orderId) {
    PurchaseOrder o = getOwnedOrder(email, orderId);
    if (o.getStatus() != OrderStatus.PENDING) throw ApiException.badRequest("Order is not payable");
    return Map.of("paymentUrl", esewa.paymentUrl(), "fields", esewa.buildPaymentForm(o), "order", OrderDto.of(o));
  }

  /**
   * Verifies an eSewa redirect (?oid &amt &refId) and issues tickets.
   * Idempotent: replayed callbacks for an already-PAID order return success
   * without creating duplicate tickets. Serialized per order via a
   * pessimistic lock, and the esewaRefId unique constraint is the final guard.
   */
  @Transactional
  public OrderDto verifyPayment(String email, VerifyRequest req) {
    PurchaseOrder o = orders.findByIdForUpdate(req.oid())
        .orElseThrow(() -> ApiException.notFound("Order not found"));
    assertOwner(email, o);
    if (o.getStatus() == OrderStatus.PAID) {
      log.info("Replayed verification for paid order {}", o.getId());
      return OrderDto.of(o);
    }
    if (o.getStatus() != OrderStatus.PENDING)
      throw ApiException.badRequest("Order is no longer payable");
    if (o.getAmountNpr() != Integer.parseInt(req.amt()))
      throw ApiException.badRequest("Amount mismatch");

    if (!esewa.verify(req.amt(), req.oid(), req.refId())) {
      markFailed(o);
      throw ApiException.badRequest("Payment could not be verified with eSewa");
    }
    // Unique constraint on esewaRefId is the final guard: the same eSewa
    // transaction can never pay two orders.
    o.setEsewaRefId(req.refId());
    o.setStatus(OrderStatus.PAID);
    o.setPaidAt(Instant.now());
    orders.saveAndFlush(o);
    tickets.issueTickets(o);
    log.info("Order {} paid, {} tickets issued", o.getId(), o.getQuantity());
    return OrderDto.of(o);
  }

  /** Buyer returned from eSewa's failure URL: release the held seats. */
  @Transactional
  public void markFailedByBuyer(String email, String orderId) {
    PurchaseOrder o = orders.findByIdForUpdate(orderId)
        .orElseThrow(() -> ApiException.notFound("Order not found"));
    assertOwner(email, o);
    if (o.getStatus() == OrderStatus.PENDING) markFailed(o);
  }

  private void markFailed(PurchaseOrder o) {
    o.setStatus(OrderStatus.FAILED);
    tiers.releaseSeats(o.getTier().getId(), o.getQuantity());
    eventService.broadcastSeats(o.getEvent().getId());
    log.info("Order {} failed, seats released", o.getId());
  }

  /** Demo mode: simulate a successful eSewa callback end-to-end without
   * leaving the app or needing merchant credentials. */
  @Transactional
  public OrderDto demoPay(String email, String orderId, EsewaProperties props) {
    if (!props.isDemoMode()) throw ApiException.forbidden("Demo payments are disabled");
    PurchaseOrder o = orders.findByIdForUpdate(orderId)
        .orElseThrow(() -> ApiException.notFound("Order not found"));
    assertOwner(email, o);
    if (o.getStatus() == OrderStatus.PAID) return OrderDto.of(o);
    if (o.getStatus() != OrderStatus.PENDING) throw ApiException.badRequest("Order is no longer payable");
    o.setEsewaRefId("DEMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    o.setStatus(OrderStatus.PAID);
    o.setPaidAt(Instant.now());
    tickets.issueTickets(o);
    log.info("Order {} paid via DEMO flow", o.getId());
    return OrderDto.of(o);
  }

  /** Expire stale PENDING reservations so seats return to inventory. */
  @Scheduled(fixedDelay = 60_000)
  @Transactional
  public void expireStaleOrders() {
    var cutoff = Instant.now().minus(RESERVATION_MINUTES, ChronoUnit.MINUTES);
    var stale = orders.findByStatusAndCreatedAtBefore(OrderStatus.PENDING, cutoff);
    for (var o : stale) {
      o.setStatus(OrderStatus.EXPIRED);
      tiers.releaseSeats(o.getTier().getId(), o.getQuantity());
      eventService.broadcastSeats(o.getEvent().getId());
      log.info("Order {} expired, seats released", o.getId());
    }
  }

  public List<OrderDto> myOrders(String email) {
    User u = userDetails.loadDomainUser(email);
    return orders.findByUserIdOrderByCreatedAtDesc(u.getId()).stream().map(OrderDto::of).toList();
  }

  public OrderDto get(String email, String orderId) {
    return OrderDto.of(getOwnedOrder(email, orderId));
  }

  private PurchaseOrder getOwnedOrder(String email, String orderId) {
    PurchaseOrder o = orders.findById(orderId).orElseThrow(() -> ApiException.notFound("Order not found"));
    assertOwner(email, o);
    return o;
  }

  private void assertOwner(String email, PurchaseOrder o) {
    if (!o.getUser().getEmail().equalsIgnoreCase(email))
      throw ApiException.forbidden("Not your order");
  }
}
