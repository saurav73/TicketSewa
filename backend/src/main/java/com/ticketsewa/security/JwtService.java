package com.ticketsewa.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {
  private final SecretKey key;
  private final long expiryMillis;

  public JwtService(@Value("${app.jwt.secret}") String secret,
                    @Value("${app.jwt.expiry-hours}") long expiryHours) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expiryMillis = expiryHours * 3_600_000L;
  }

  /**
   * Issues a signed JWT for the given user. The email becomes the subject and
   * the role is stored as a claim; the token expires after the configured
   * number of hours (24 by default).
   */
  public String generate(String email, String role) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(email)
        .claim("role", role)
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusMillis(expiryMillis)))
        .signWith(key)
        .compact();
  }

  /**
   * Returns the subject (user email) of a valid signed token.
   * Throws if the token is invalid, expired, or tampered with.
   */
  public String extractEmail(String token) {
    return parse(token).getPayload().getSubject();
  }

  /**
   * Checks whether a token is well-formed, signed with this service's key,
   * and not expired. Never throws; returns false for any invalid token.
   */
  public boolean isValid(String token) {
    try {
      parse(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  private Jws<Claims> parse(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
  }
}
