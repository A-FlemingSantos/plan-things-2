package com.planthings.api.github;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "plan_github_repos")
public class PlanGitHubRepoEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false)
  private UUID connectionUserId;

  @Column(nullable = false)
  private Long githubRepoId;

  @Column(nullable = false, length = 260)
  private String repoFullName;

  @Column(length = 500)
  private String ownerAvatarUrl;

  @Column(nullable = false)
  private Boolean isPrivate = false;

  @Column(length = 120)
  private String defaultBranch;

  @Column(nullable = false)
  private OffsetDateTime connectedAt;

  @Column(nullable = false)
  private UUID connectedByUserId;

  private OffsetDateTime removedAt;

  @Column(length = 120)
  private String lastError;

  private OffsetDateTime lastSyncedAt;

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public UUID getConnectionUserId() {
    return connectionUserId;
  }

  public void setConnectionUserId(UUID connectionUserId) {
    this.connectionUserId = connectionUserId;
  }

  public Long getGithubRepoId() {
    return githubRepoId;
  }

  public void setGithubRepoId(Long githubRepoId) {
    this.githubRepoId = githubRepoId;
  }

  public String getRepoFullName() {
    return repoFullName;
  }

  public void setRepoFullName(String repoFullName) {
    this.repoFullName = repoFullName;
  }

  public String getOwnerAvatarUrl() {
    return ownerAvatarUrl;
  }

  public void setOwnerAvatarUrl(String ownerAvatarUrl) {
    this.ownerAvatarUrl = ownerAvatarUrl;
  }

  public Boolean getIsPrivate() {
    return isPrivate;
  }

  public void setIsPrivate(Boolean isPrivate) {
    this.isPrivate = isPrivate;
  }

  public String getDefaultBranch() {
    return defaultBranch;
  }

  public void setDefaultBranch(String defaultBranch) {
    this.defaultBranch = defaultBranch;
  }

  public OffsetDateTime getConnectedAt() {
    return connectedAt;
  }

  public void setConnectedAt(OffsetDateTime connectedAt) {
    this.connectedAt = connectedAt;
  }

  public UUID getConnectedByUserId() {
    return connectedByUserId;
  }

  public void setConnectedByUserId(UUID connectedByUserId) {
    this.connectedByUserId = connectedByUserId;
  }

  public OffsetDateTime getRemovedAt() {
    return removedAt;
  }

  public void setRemovedAt(OffsetDateTime removedAt) {
    this.removedAt = removedAt;
  }

  public String getLastError() {
    return lastError;
  }

  public void setLastError(String lastError) {
    this.lastError = lastError;
  }

  public OffsetDateTime getLastSyncedAt() {
    return lastSyncedAt;
  }

  public void setLastSyncedAt(OffsetDateTime lastSyncedAt) {
    this.lastSyncedAt = lastSyncedAt;
  }
}
