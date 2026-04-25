package com.planthings.api.settings;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "gmail_connections")
public class GmailConnectionEntity extends BaseEntity {

  @Column(nullable = false, unique = true)
  private UUID userId;

  @Column(nullable = false, length = 160)
  private String email;

  @Column(nullable = false, length = 1000)
  private String scopes;

  @Column(nullable = false, length = 2000)
  private String encryptedRefreshToken;

  @Column(nullable = false)
  private OffsetDateTime connectedAt;

  private OffsetDateTime revokedAt;

  @Column(length = 120)
  private String lastError;

  private OffsetDateTime lastCheckedAt;

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getScopes() {
    return scopes;
  }

  public void setScopes(String scopes) {
    this.scopes = scopes;
  }

  public String getEncryptedRefreshToken() {
    return encryptedRefreshToken;
  }

  public void setEncryptedRefreshToken(String encryptedRefreshToken) {
    this.encryptedRefreshToken = encryptedRefreshToken;
  }

  public OffsetDateTime getConnectedAt() {
    return connectedAt;
  }

  public void setConnectedAt(OffsetDateTime connectedAt) {
    this.connectedAt = connectedAt;
  }

  public OffsetDateTime getRevokedAt() {
    return revokedAt;
  }

  public void setRevokedAt(OffsetDateTime revokedAt) {
    this.revokedAt = revokedAt;
  }

  public String getLastError() {
    return lastError;
  }

  public void setLastError(String lastError) {
    this.lastError = lastError;
  }

  public OffsetDateTime getLastCheckedAt() {
    return lastCheckedAt;
  }

  public void setLastCheckedAt(OffsetDateTime lastCheckedAt) {
    this.lastCheckedAt = lastCheckedAt;
  }
}
