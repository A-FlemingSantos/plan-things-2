package com.planthings.api.files;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "card_attachments")
public class CardAttachmentEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID cardId;

  @Column(nullable = false)
  private UUID fileEntryId;

  @Column(nullable = false)
  private UUID attachedByUserId;

  public UUID getCardId() {
    return cardId;
  }

  public void setCardId(UUID cardId) {
    this.cardId = cardId;
  }

  public UUID getFileEntryId() {
    return fileEntryId;
  }

  public void setFileEntryId(UUID fileEntryId) {
    this.fileEntryId = fileEntryId;
  }

  public UUID getAttachedByUserId() {
    return attachedByUserId;
  }

  public void setAttachedByUserId(UUID attachedByUserId) {
    this.attachedByUserId = attachedByUserId;
  }
}
