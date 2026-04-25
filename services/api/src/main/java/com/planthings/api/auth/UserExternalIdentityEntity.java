package com.planthings.api.auth;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "user_external_identities")
public class UserExternalIdentityEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID userId;

  @Column(nullable = false, length = 40)
  private String provider;

  @Column(nullable = false, length = 255)
  private String providerSubject;

  @Column(nullable = false, length = 160)
  private String email;

  @Column(nullable = false)
  private boolean emailVerified;

  @Column(length = 160)
  private String displayName;

  @Column(length = 500)
  private String avatarUrl;

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getProvider() {
    return provider;
  }

  public void setProvider(String provider) {
    this.provider = provider;
  }

  public String getProviderSubject() {
    return providerSubject;
  }

  public void setProviderSubject(String providerSubject) {
    this.providerSubject = providerSubject;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public boolean isEmailVerified() {
    return emailVerified;
  }

  public void setEmailVerified(boolean emailVerified) {
    this.emailVerified = emailVerified;
  }

  public String getDisplayName() {
    return displayName;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public void setAvatarUrl(String avatarUrl) {
    this.avatarUrl = avatarUrl;
  }
}
