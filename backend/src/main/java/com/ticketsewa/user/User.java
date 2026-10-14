package com.ticketsewa.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * A platform account. Email is the login identifier (unique) and the password
 * is stored only as a hash. The {@link Role} drives RBAC: attendees buy
 * tickets, organizers manage their own events, admins manage everything.
 */
@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role;

  @CreationTimestamp
  @Column(updatable = false)
  private Instant createdAt;
}
