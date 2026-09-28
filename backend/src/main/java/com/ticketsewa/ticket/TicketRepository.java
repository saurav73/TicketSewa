package com.ticketsewa.ticket;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
  List<Ticket> findByHolderIdOrderByCreatedAtDesc(Long holderId);
  List<Ticket> findByOrderId(String orderId);
  Optional<Ticket> findByCode(String code);
  long countByEventIdAndStatus(Long eventId, TicketStatus status);

  /**
   * Atomic check-in: flips VALID to USED only if still VALID.
   * Returns 1 on success, 0 if already used/refunded — a double scan
   * (or two gates scanning at once) can never admit the same ticket twice.
   */
  @Modifying
  @Query("UPDATE Ticket t SET t.status = :used, t.usedAt = :now " +
         "WHERE t.code = :code AND t.status = :valid")
  int checkIn(@Param("code") String code,
              @Param("valid") TicketStatus valid,
              @Param("used") TicketStatus used,
              @Param("now") java.time.Instant now);
}
