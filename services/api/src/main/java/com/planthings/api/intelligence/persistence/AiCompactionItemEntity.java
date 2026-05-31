package com.planthings.api.intelligence.persistence;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "ai_compaction_items")
public class AiCompactionItemEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID conversationId;

  @Column
  private UUID messageId;

  @Column(length = 120)
  private String openaiResponseId;

  @Column(nullable = false, length = 40)
  private String compactionMode;

  @Column
  private Integer compactThreshold;

  @Column
  private Integer inputTokenEstimate;

  @Column(length = 200)
  private String outputItemRef;

  @Lob
  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String opaquePayloadJson;

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

  public String getCompactionMode() {
    return compactionMode;
  }

  public void setCompactionMode(String compactionMode) {
    this.compactionMode = compactionMode;
  }

  public Integer getCompactThreshold() {
    return compactThreshold;
  }

  public void setCompactThreshold(Integer compactThreshold) {
    this.compactThreshold = compactThreshold;
  }

  public Integer getInputTokenEstimate() {
    return inputTokenEstimate;
  }

  public void setInputTokenEstimate(Integer inputTokenEstimate) {
    this.inputTokenEstimate = inputTokenEstimate;
  }

  public String getOutputItemRef() {
    return outputItemRef;
  }

  public void setOutputItemRef(String outputItemRef) {
    this.outputItemRef = outputItemRef;
  }

  public String getOpaquePayloadJson() {
    return opaquePayloadJson;
  }

  public void setOpaquePayloadJson(String opaquePayloadJson) {
    this.opaquePayloadJson = opaquePayloadJson;
  }
}
