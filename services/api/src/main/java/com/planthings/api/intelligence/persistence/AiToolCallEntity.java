package com.planthings.api.intelligence.persistence;

import com.planthings.api.common.persistence.BaseEntity;
import com.planthings.api.intelligence.model.AiToolCallStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_tool_calls")
public class AiToolCallEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID conversationId;

  @Column(nullable = false)
  private UUID messageId;

  @Column(length = 120)
  private String openaiResponseId;

  @Column(nullable = false, length = 80)
  private String toolName;

  @Column(length = 120)
  private String capabilityId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private AiToolCallStatus status;

  @Lob
  @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
  private String argumentsJson;

  @Lob
  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String resultJson;

  @Column(length = 80)
  private String errorCode;

  @Column(nullable = false)
  private OffsetDateTime startedAt;

  @Column
  private OffsetDateTime completedAt;

  @Column
  private Integer durationMs;

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

  public String getOpenaiResponseId() {
    return openaiResponseId;
  }

  public void setOpenaiResponseId(String openaiResponseId) {
    this.openaiResponseId = openaiResponseId;
  }

  public String getToolName() {
    return toolName;
  }

  public void setToolName(String toolName) {
    this.toolName = toolName;
  }

  public String getCapabilityId() {
    return capabilityId;
  }

  public void setCapabilityId(String capabilityId) {
    this.capabilityId = capabilityId;
  }

  public AiToolCallStatus getStatus() {
    return status;
  }

  public void setStatus(AiToolCallStatus status) {
    this.status = status;
  }

  public String getArgumentsJson() {
    return argumentsJson;
  }

  public void setArgumentsJson(String argumentsJson) {
    this.argumentsJson = argumentsJson;
  }

  public String getResultJson() {
    return resultJson;
  }

  public void setResultJson(String resultJson) {
    this.resultJson = resultJson;
  }

  public String getErrorCode() {
    return errorCode;
  }

  public void setErrorCode(String errorCode) {
    this.errorCode = errorCode;
  }

  public OffsetDateTime getStartedAt() {
    return startedAt;
  }

  public void setStartedAt(OffsetDateTime startedAt) {
    this.startedAt = startedAt;
  }

  public OffsetDateTime getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(OffsetDateTime completedAt) {
    this.completedAt = completedAt;
  }

  public Integer getDurationMs() {
    return durationMs;
  }

  public void setDurationMs(Integer durationMs) {
    this.durationMs = durationMs;
  }
}
