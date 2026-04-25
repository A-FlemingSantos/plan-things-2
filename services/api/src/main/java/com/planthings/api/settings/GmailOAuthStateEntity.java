package com.planthings.api.settings;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "gmail_oauth_states")
public class GmailOAuthStateEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID userId;

  @Column(nullable = false, unique = true, length = 120)
  private String stateToken;

  @Column(nullable = false, length = 120)
  private String nonce;

  @Column(nullable = false)
  private OffsetDateTime expiresAt;

  private OffsetDateTime usedAt;

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getStateToken() {
    return stateToken;
  }

  public void setStateToken(String stateToken) {
    this.stateToken = stateToken;
  }

  public String getNonce() {
    return nonce;
  }

  public void setNonce(String nonce) {
    this.nonce = nonce;
  }

  public OffsetDateTime getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(OffsetDateTime expiresAt) {
    this.expiresAt = expiresAt;
  }

  public OffsetDateTime getUsedAt() {
    return usedAt;
  }

  public void setUsedAt(OffsetDateTime usedAt) {
    this.usedAt = usedAt;
  }
}
