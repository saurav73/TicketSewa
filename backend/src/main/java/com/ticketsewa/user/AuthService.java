package com.ticketsewa.user;

import com.ticketsewa.common.ApiException;
import com.ticketsewa.security.JwtService;
import jakarta.validation.constraints.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final JwtService jwt;

  public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
    this.users = users;
    this.encoder = encoder;
    this.jwt = jwt;
  }

  /**
   * Sign-up payload. The password is hashed before storage, emails are
   * stored lowercased, and self-registering as admin is rejected.
   */
  public record RegisterRequest(
      @NotBlank String name,
      @Email @NotBlank String email,
      @Size(min = 6, message = "password must be at least 6 characters") String password,
      Role role) {}

  /** Sign-in payload (email lookup is case-insensitive). */
  public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
  /** Sign-up / sign-in result: a JWT plus the user's profile. */
  public record AuthResponse(String token, String name, String email, String role) {}

  /**
   * Creates an account and returns a JWT. Duplicate emails are rejected;
   * a missing role defaults to ATTENDEE.
   */
  @Transactional
  public AuthResponse register(RegisterRequest req) {
    String email = req.email().trim().toLowerCase();
    if (users.existsByEmail(email)) throw ApiException.conflict("Email already registered");
    Role role = req.role() == null ? Role.ATTENDEE : req.role();
    if (role == Role.ADMIN) throw ApiException.forbidden("Cannot self-register as admin");
    User u = users.save(User.builder()
        .name(req.name().trim()).email(email)
        .passwordHash(encoder.encode(req.password()))
        .role(role).build());
    return new AuthResponse(jwt.generate(u.getEmail(), u.getRole().name()), u.getName(), u.getEmail(), u.getRole().name());
  }

  /**
   * Authenticates with email + password and returns a fresh JWT. Failed
   * logins report "invalid email or password" without revealing which
   * part was wrong.
   */
  public AuthResponse login(LoginRequest req) {
    String email = req.email().trim().toLowerCase();
    User u = users.findByEmail(email).orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
    if (!encoder.matches(req.password(), u.getPasswordHash()))
      throw ApiException.unauthorized("Invalid email or password");
    return new AuthResponse(jwt.generate(u.getEmail(), u.getRole().name()), u.getName(), u.getEmail(), u.getRole().name());
  }
}
