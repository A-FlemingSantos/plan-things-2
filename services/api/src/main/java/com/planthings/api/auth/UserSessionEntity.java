package com.planthings.api.auth;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_sessions")
public class UserSessionEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID userId;

  @Column(nullable = false, length = 20)
  private String client;

  @Column(nullable = false, length = 160)
  private String deviceLabel;

  @Column(length = 1000)
  private String userAgent;

  @Column(nullable = false)
  private OffsetDateTime lastSeenAt;

  @Column
  private OffsetDateTime revokedAt;

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getClient() {
    return client;
  }

  public void setClient(String client) {
    this.client = client;
  }

  public String getDeviceLabel() {
    return deviceLabel;
  }

  public void setDeviceLabel(String deviceLabel) {
    this.deviceLabel = deviceLabel;
  }

  public String getUserAgent() {
    return userAgent;
  }

  public void setUserAgent(String userAgent) {
    this.userAgent = userAgent;
  }

  public OffsetDateTime getLastSeenAt() {
    return lastSeenAt;
  }

  public void setLastSeenAt(OffsetDateTime lastSeenAt) {
    this.lastSeenAt = lastSeenAt;
  }

  public OffsetDateTime getRevokedAt() {
    return revokedAt;
  }

  public void setRevokedAt(OffsetDateTime revokedAt) {
    this.revokedAt = revokedAt;
  }
}
