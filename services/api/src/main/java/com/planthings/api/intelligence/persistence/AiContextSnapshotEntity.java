package com.planthings.api.intelligence.persistence;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "ai_context_snapshots")
public class AiContextSnapshotEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID conversationId;

  @Column(nullable = false)
  private UUID messageId;

  @Column(nullable = false)
  private UUID workspaceId;

  @Column
  private UUID planId;

  @Lob
  @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
  private String contextJson;

  @Column
  private Integer tokenEstimate;

  public UUID getConversationId() {
    return conversationId;
  }

  public void setConversationId(UUID conversationId) {
    this.conversationId = conversationId;
  }

  public UUID getMessageId() {
    return messageId;
  }

  public void setMessageId(UUID messageId) {
    this.messageId = messageId;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public void setWorkspaceId(UUID workspaceId) {
    this.workspaceId = workspaceId;
  }

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public String getContextJson() {
    return contextJson;
  }

  public void setContextJson(String contextJson) {
    this.contextJson = contextJson;
  }

  public Integer getTokenEstimate() {
    return tokenEstimate;
  }

  public void setTokenEstimate(Integer tokenEstimate) {
    this.tokenEstimate = tokenEstimate;
  }
}
