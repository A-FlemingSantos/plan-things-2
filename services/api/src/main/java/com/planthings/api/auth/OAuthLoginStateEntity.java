package com.planthings.api.auth;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "oauth_login_states")
public class OAuthLoginStateEntity extends BaseEntity {

  @Column(nullable = false, unique = true, length = 120)
  private String stateToken;

  @Column(nullable = false, length = 40)
  private String provider;

  @Column(nullable = false, length = 120)
  private String nonce;

  @Column(length = 500)
  private String redirectPath;

  @Column(nullable = false)
  private OffsetDateTime expiresAt;

  private OffsetDateTime usedAt;

  public String getStateToken() {
    return stateToken;
  }

  public void setStateToken(String stateToken) {
    this.stateToken = stateToken;
  }

  public String getProvider() {
    return provider;
  }

  public void setProvider(String provider) {
    this.provider = provider;
  }

  public String getNonce() {
    return nonce;
  }

  public void setNonce(String nonce) {
    this.nonce = nonce;
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
