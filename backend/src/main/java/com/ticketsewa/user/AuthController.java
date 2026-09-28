package com.ticketsewa.user;

import jakarta.validation.Valid;
import com.ticketsewa.security.CustomUserDetailsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService auth;
  private final CustomUserDetailsService userDetails;

  public AuthController(AuthService auth, CustomUserDetailsService userDetails) {
    this.auth = auth;
    this.userDetails = userDetails;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthService.AuthResponse> register(@Valid @RequestBody AuthService.RegisterRequest req) {
    return ResponseEntity.ok(auth.register(req));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthService.AuthResponse> login(@Valid @RequestBody AuthService.LoginRequest req) {
    return ResponseEntity.ok(auth.login(req));
  }

  @GetMapping("/me")
  public ResponseEntity<Map<String, String>> me(@AuthenticationPrincipal UserDetails principal) {
    var u = userDetails.loadDomainUser(principal.getUsername());
    return ResponseEntity.ok(Map.of(
        "name", u.getName(), "email", u.getEmail(), "role", u.getRole().name()));
  }
}
