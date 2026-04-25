package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "board_card_inbox_deliveries")
public class BoardCardInboxDeliveryEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false)
  private UUID cardId;

  @Column(nullable = false)
  private UUID sentByUserId;

  @Column(nullable = false, length = 160)
  private String sentFrom;

  @Column(length = 255)
  private String messageId;

  @Column(length = 255)
  private String threadId;

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

  public UUID getSentByUserId() {
    return sentByUserId;
  }

  public void setSentByUserId(UUID sentByUserId) {
    this.sentByUserId = sentByUserId;
  }

  public String getSentFrom() {
    return sentFrom;
  }

  public void setSentFrom(String sentFrom) {
    this.sentFrom = sentFrom;
  }

  public String getMessageId() {
    return messageId;
  }

  public void setMessageId(String messageId) {
    this.messageId = messageId;
  }

  public String getThreadId() {
    return threadId;
  }

  public void setThreadId(String threadId) {
    this.threadId = threadId;
  }
}
