package com.planthings.api.github;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "board_card_github_links")
public class BoardCardGitHubLinkEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false)
  private UUID cardId;

  @Column(nullable = false)
  private UUID planGithubRepoId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private GitHubLinkType linkType;

  private Integer githubNumber;

  @Column(length = 260)
  private String githubRef;

  @Column(length = 64)
  private String githubSha;

  @Column(nullable = false, length = 260)
  private String repoFullName;

  @Column(nullable = false, length = 500)
  private String title;

  @Column(nullable = false, length = 500)
  private String url;

  @Column(length = 20)
  private String status;

  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String snapshotJson;

  @Column(name = "is_completion_anchor", nullable = false)
  private Boolean completionAnchor = false;

  @Column(nullable = false)
  private Boolean unavailable = false;

  @Column(nullable = false)
  private UUID linkedByUserId;

  private OffsetDateTime lastSyncedAt;

  @Column(length = 120)
  private String syncEtag;

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public UUID getCardId() {
    return cardId;
  }

  public void setCardId(UUID cardId) {
    this.cardId = cardId;
  }

  public UUID getPlanGithubRepoId() {
    return planGithubRepoId;
  }

  public void setPlanGithubRepoId(UUID planGithubRepoId) {
    this.planGithubRepoId = planGithubRepoId;
  }

  public GitHubLinkType getLinkType() {
    return linkType;
  }

  public void setLinkType(GitHubLinkType linkType) {
    this.linkType = linkType;
  }

  public Integer getGithubNumber() {
    return githubNumber;
  }

  public void setGithubNumber(Integer githubNumber) {
    this.githubNumber = githubNumber;
  }

  public String getGithubRef() {
    return githubRef;
  }

  public void setGithubRef(String githubRef) {
    this.githubRef = githubRef;
  }

  public String getGithubSha() {
    return githubSha;
  }

  public void setGithubSha(String githubSha) {
    this.githubSha = githubSha;
  }

  public String getRepoFullName() {
    return repoFullName;
  }

  public void setRepoFullName(String repoFullName) {
    this.repoFullName = repoFullName;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getSnapshotJson() {
    return snapshotJson;
  }

  public void setSnapshotJson(String snapshotJson) {
    this.snapshotJson = snapshotJson;
  }

  public Boolean getCompletionAnchor() {
    return completionAnchor;
  }

  public void setCompletionAnchor(Boolean completionAnchor) {
    this.completionAnchor = completionAnchor;
  }

  public Boolean getUnavailable() {
    return unavailable;
  }

  public void setUnavailable(Boolean unavailable) {
    this.unavailable = unavailable;
  }

  public UUID getLinkedByUserId() {
    return linkedByUserId;
  }

  public void setLinkedByUserId(UUID linkedByUserId) {
    this.linkedByUserId = linkedByUserId;
  }

  public OffsetDateTime getLastSyncedAt() {
    return lastSyncedAt;
  }

  public void setLastSyncedAt(OffsetDateTime lastSyncedAt) {
    this.lastSyncedAt = lastSyncedAt;
  }

  public String getSyncEtag() {
    return syncEtag;
  }

  public void setSyncEtag(String syncEtag) {
    this.syncEtag = syncEtag;
  }
}
