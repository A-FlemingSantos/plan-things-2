package com.planthings.api.intelligence.persistence;

import com.planthings.api.common.persistence.BaseEntity;
import com.planthings.api.intelligence.model.AiMessageBlockType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "ai_message_blocks")
public class AiMessageBlockEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID messageId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 60)
  private AiMessageBlockType blockType;

  @Column(nullable = false)
  private Integer position;

  @Column(length = 40)
  private String entityType;

  @Column
  private UUID entityId;

  @Column(length = 40)
  private String externalProvider;

  @Column(length = 40)
  private String externalType;

  @Column(length = 200)
  private String externalId;

  @Column
  private UUID actionProposalId;

  @Column(length = 500)
  private String href;

  @Column(length = 300)
  private String title;

  @Lob
  @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
  private String payloadJson;

  @Lob
  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String snapshotJson;

  public UUID getMessageId() {
    return messageId;
  }

  public void setMessageId(UUID messageId) {
    this.messageId = messageId;
  }

  public AiMessageBlockType getBlockType() {
    return blockType;
  }

  public void setBlockType(AiMessageBlockType blockType) {
    this.blockType = blockType;
  }

  public Integer getPosition() {
    return position;
  }

  public void setPosition(Integer position) {
    this.position = position;
  }

  public String getEntityType() {
    return entityType;
  }

  public void setEntityType(String entityType) {
    this.entityType = entityType;
  }

  public UUID getEntityId() {
    return entityId;
  }

  public void setEntityId(UUID entityId) {
    this.entityId = entityId;
  }

  public String getExternalProvider() {
    return externalProvider;
  }

  public void setExternalProvider(String externalProvider) {
    this.externalProvider = externalProvider;
  }

  public String getExternalType() {
    return externalType;
  }

  public void setExternalType(String externalType) {
    this.externalType = externalType;
  }

  public String getExternalId() {
    return externalId;
  }

  public void setExternalId(String externalId) {
    this.externalId = externalId;
  }

  public UUID getActionProposalId() {
    return actionProposalId;
  }

  public void setActionProposalId(UUID actionProposalId) {
    this.actionProposalId = actionProposalId;
  }

  public String getHref() {
    return href;
  }

  public void setHref(String href) {
    this.href = href;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getPayloadJson() {
    return payloadJson;
  }

  public void setPayloadJson(String payloadJson) {
    this.payloadJson = payloadJson;
  }

  public String getSnapshotJson() {
    return snapshotJson;
  }

  public void setSnapshotJson(String snapshotJson) {
    this.snapshotJson = snapshotJson;
  }
}
