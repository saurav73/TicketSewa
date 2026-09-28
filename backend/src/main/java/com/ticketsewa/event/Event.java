package com.ticketsewa.event;

import com.ticketsewa.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "organizer_id")
  private User organizer;

  @Column(nullable = false)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(nullable = false)
  private String venue;

  @Column(nullable = false)
  private String city;

  @Column(nullable = false)
  private LocalDateTime startsAt;

  private LocalDateTime endsAt;

  private String bannerUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private EventStatus status = EventStatus.DRAFT;

  @CreationTimestamp
  @Column(updatable = false)
  private Instant createdAt;
}
