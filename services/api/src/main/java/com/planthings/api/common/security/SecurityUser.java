package com.planthings.api.common.security;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class SecurityUser implements UserDetails {

  private final UUID userId;
  private final String email;
  private final String passwordHash;
  private final Collection<? extends GrantedAuthority> authorities;

  public SecurityUser(UUID userId, String email, String passwordHash) {
    this.userId = userId;
    this.email = email;
    this.passwordHash = passwordHash == null ? "" : passwordHash;
    this.authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
  }

  public UUID getUserId() {
    return userId;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return authorities;
  }

  @Override
  public String getPassword() {
    return passwordHash;
  }

  @Override
  public String getUsername() {
    return email;
  }
}
