package com.ticketsewa.order;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, String> {
  Optional<PurchaseOrder> findByIdempotencyKey(String idempotencyKey);
  List<PurchaseOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

  /** Pessimistic lock: payment verification serializes per order, making double-callbacks safe. */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT o FROM PurchaseOrder o WHERE o.id = :id")
  Optional<PurchaseOrder> findByIdForUpdate(@Param("id") String id);

  List<PurchaseOrder> findByStatusAndCreatedAtBefore(OrderStatus status, Instant before);
}
