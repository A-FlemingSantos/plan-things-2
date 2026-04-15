package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "board_card_comments")
public class BoardCardCommentEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID cardId;

  @Column(nullable = false)
  private UUID authorUserId;

  @Column(nullable = false, length = 4000)
  private String message;

  public UUID getCardId() {
    return cardId;
  }

  public void setCardId(UUID cardId) {
    this.cardId = cardId;
  }

  public UUID getAuthorUserId() {
    return authorUserId;
  }

  public void setAuthorUserId(UUID authorUserId) {
    this.authorUserId = authorUserId;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }
}
