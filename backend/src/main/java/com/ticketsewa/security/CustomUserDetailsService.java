package com.ticketsewa.security;

import com.ticketsewa.user.User;
import com.ticketsewa.user.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {
  private final UserRepository users;

  public CustomUserDetailsService(UserRepository users) {
    this.users = users;
  }

  /**
   * Spring Security entry point: loads the user by email for authentication,
   * mapping the app role onto a granted authority (e.g. ROLE_ORGANIZER).
   * Throws {@link UsernameNotFoundException} when the email is unknown.
   */
  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    User u = users.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    return new org.springframework.security.core.userdetails.User(
        u.getEmail(), u.getPasswordHash(),
        List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())));
  }

  /**
   * Loads the raw domain {@link User} by email for places where the full
   * entity (not just auth details) is needed. Throws when the email is
   * unknown.
   */
  public User loadDomainUser(String email) {
    return users.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));
  }
}
