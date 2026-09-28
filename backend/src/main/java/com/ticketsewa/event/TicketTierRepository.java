package com.ticketsewa.event;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketTierRepository extends JpaRepository<TicketTier, Long> {
  List<TicketTier> findByEventIdOrderByPriceNprAsc(Long eventId);

  /**
   * Atomically reserves {@code qty} seats iff enough remain.
   * Returns 1 when the reservation succeeded, 0 when sold out.
   * The conditional UPDATE makes overselling impossible under concurrency:
   * two racing transactions cannot both pass the remaining-seats check.
   */
  @Modifying
  @Query("UPDATE TicketTier t SET t.quantitySold = t.quantitySold + :qty " +
         "WHERE t.id = :id AND t.quantitySold + :qty <= t.quantityTotal")
  int reserveSeats(@Param("id") Long id, @Param("qty") int qty);

  /** Releases seats previously reserved (payment failed / order expired). */
  @Modifying
  @Query("UPDATE TicketTier t SET t.quantitySold = t.quantitySold - :qty " +
         "WHERE t.id = :id AND t.quantitySold >= :qty")
  int releaseSeats(@Param("id") Long id, @Param("qty") int qty);
}
