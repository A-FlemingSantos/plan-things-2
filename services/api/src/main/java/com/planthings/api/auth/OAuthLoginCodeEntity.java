package com.planthings.api.auth;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "oauth_login_codes")
public class OAuthLoginCodeEntity extends BaseEntity {

  @Column(nullable = false, unique = true, length = 120)
  private String completionCode;

  @Column(nullable = false)
  private UUID userId;

  @Column(length = 500)
  private String redirectPath;

  @Column(nullable = false)
  private OffsetDateTime expiresAt;

  private OffsetDateTime usedAt;

  public String getCompletionCode() {
    return completionCode;
  }

  public void setCompletionCode(String completionCode) {
    this.completionCode = completionCode;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getRedirectPath() {
    return redirectPath;
  }

  public void setRedirectPath(String redirectPath) {
    this.redirectPath = redirectPath;
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
