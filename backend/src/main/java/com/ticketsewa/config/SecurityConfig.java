package com.ticketsewa.config;

import com.ticketsewa.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
/**
 * Stateless JWT security: the JWT filter runs before Spring's auth filter,
 * method-level RBAC ({@code @PreAuthorize}) enforces ORGANIZER/ADMIN roles,
 * CORS is restricted to the SPA origin, and all endpoints are permit-by-default
 * only for the public browse, health and demo-probe paths.
 */
public class SecurityConfig {
  @Value("${app.frontend-url}")
  private String frontendUrl;

  /**
   * Builds the stateless filter chain: CSRF off, CORS from the SPA origin,
   * public auth/event/health/demo paths, the JWT filter before Spring's auth
   * filter, and authentication required for every other /api path.
   */
  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
    http
        .csrf(c -> c.disable())
        .cors(c -> c.configurationSource(corsSource()))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/events", "/api/events/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/payments/demo/enabled").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
            .requestMatchers("/error").permitAll()
            .requestMatchers("/api/**").authenticated()
            .anyRequest().permitAll())
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  /**
   * CORS policy for the SPA origin: GET/POST/PUT/DELETE/OPTIONS, any headers,
   * credentials allowed.
   */
  @Bean
  public CorsConfigurationSource corsSource() {
    var cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of(frontendUrl));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);
    var src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }

  /** BCrypt password hashing for stored user passwords. */
  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  /** Exposes Spring's AuthenticationManager for the login flow. */
  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
    return cfg.getAuthenticationManager();
  }
}
