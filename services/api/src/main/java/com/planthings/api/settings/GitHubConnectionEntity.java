package com.planthings.api.settings;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "github_connections")
public class GitHubConnectionEntity extends BaseEntity {

  @Column(nullable = false, unique = true)
  private UUID userId;

  @Column(nullable = false)
  private Long githubUserId;

  @Column(nullable = false, length = 120)
  private String githubLogin;

  @Column(length = 500)
  private String githubAvatarUrl;

  @Column(nullable = false, length = 500)
  private String scopes;

  @Column(nullable = false, length = 2000)
  private String encryptedAccessToken;

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

  public Long getGithubUserId() {
    return githubUserId;
  }

  public void setGithubUserId(Long githubUserId) {
    this.githubUserId = githubUserId;
  }

  public String getGithubLogin() {
    return githubLogin;
  }

  public void setGithubLogin(String githubLogin) {
    this.githubLogin = githubLogin;
  }

  public String getGithubAvatarUrl() {
    return githubAvatarUrl;
  }

  public void setGithubAvatarUrl(String githubAvatarUrl) {
    this.githubAvatarUrl = githubAvatarUrl;
  }

  public String getScopes() {
    return scopes;
  }

  public void setScopes(String scopes) {
    this.scopes = scopes;
  }

  public String getEncryptedAccessToken() {
    return encryptedAccessToken;
  }

  public void setEncryptedAccessToken(String encryptedAccessToken) {
    this.encryptedAccessToken = encryptedAccessToken;
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
