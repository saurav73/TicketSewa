package com.ticketsewa.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Persistence access for {@link User}s. Email-based lookups back
 * registration, login, and the JWT user-details service.
 */
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);
  boolean existsByEmail(String email);
}
