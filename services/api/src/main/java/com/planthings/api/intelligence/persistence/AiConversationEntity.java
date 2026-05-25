package com.planthings.api.intelligence.persistence;

import com.planthings.api.common.persistence.BaseEntity;
import com.planthings.api.intelligence.model.AiConversationScopeType;
import com.planthings.api.intelligence.model.AiConversationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "ai_conversations")
public class AiConversationEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID workspaceId;

  @Column
  private UUID planId;

  @Column
  private UUID cardId;

  @Column(nullable = false)
  private UUID createdByUserId;

  @Column(length = 200)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private AiConversationScopeType scopeType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AiConversationStatus status = AiConversationStatus.ACTIVE;

  @Column(length = 120)
  private String openaiConversationId;

  @Column(length = 120)
  private String lastOpenaiResponseId;

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

  public UUID getCardId() {
    return cardId;
  }

  public void setCardId(UUID cardId) {
    this.cardId = cardId;
  }

  public UUID getCreatedByUserId() {
    return createdByUserId;
  }

  public void setCreatedByUserId(UUID createdByUserId) {
    this.createdByUserId = createdByUserId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public AiConversationScopeType getScopeType() {
    return scopeType;
  }

  public void setScopeType(AiConversationScopeType scopeType) {
    this.scopeType = scopeType;
  }

  public AiConversationStatus getStatus() {
    return status;
  }

  public void setStatus(AiConversationStatus status) {
    this.status = status;
  }

  public String getOpenaiConversationId() {
    return openaiConversationId;
  }

  public void setOpenaiConversationId(String openaiConversationId) {
    this.openaiConversationId = openaiConversationId;
  }

  public String getLastOpenaiResponseId() {
    return lastOpenaiResponseId;
  }

  public void setLastOpenaiResponseId(String lastOpenaiResponseId) {
    this.lastOpenaiResponseId = lastOpenaiResponseId;
  }
}
