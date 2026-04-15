package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "board_checklists")
public class BoardChecklistEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID cardId;

  @Column(nullable = false, length = 160)
  private String title;

  @Column(nullable = false)
  private Integer positionIndex;

  public UUID getCardId() {
    return cardId;
  }

  public void setCardId(UUID cardId) {
    this.cardId = cardId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Integer getPositionIndex() {
    return positionIndex;
  }

  public void setPositionIndex(Integer positionIndex) {
    this.positionIndex = positionIndex;
  }
}
