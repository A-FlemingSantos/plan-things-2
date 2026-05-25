package com.planthings.api.intelligence.persistence;

import com.planthings.api.common.persistence.BaseEntity;
import com.planthings.api.intelligence.model.AiMessageRole;
import com.planthings.api.intelligence.model.AiMessageStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "ai_messages")
public class AiMessageEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID conversationId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AiMessageRole role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AiMessageStatus status = AiMessageStatus.PENDING;

  @Lob
  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String contentText;

  @Column(length = 120)
  private String openaiResponseId;

  @Lob
  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String tokenUsageJson;

  @Column(length = 80)
  private String errorCode;

  public UUID getConversationId() {
    return conversationId;
  }

  public void setConversationId(UUID conversationId) {
    this.conversationId = conversationId;
  }

  public AiMessageRole getRole() {
    return role;
  }

  public void setRole(AiMessageRole role) {
    this.role = role;
  }

  public AiMessageStatus getStatus() {
    return status;
  }

  public void setStatus(AiMessageStatus status) {
    this.status = status;
  }

  public String getContentText() {
    return contentText;
  }

  public void setContentText(String contentText) {
    this.contentText = contentText;
  }

  public String getOpenaiResponseId() {
    return openaiResponseId;
  }

  public void setOpenaiResponseId(String openaiResponseId) {
    this.openaiResponseId = openaiResponseId;
  }

  public String getTokenUsageJson() {
    return tokenUsageJson;
  }

  public void setTokenUsageJson(String tokenUsageJson) {
    this.tokenUsageJson = tokenUsageJson;
  }

  public String getErrorCode() {
    return errorCode;
  }

  public void setErrorCode(String errorCode) {
    this.errorCode = errorCode;
  }
}
