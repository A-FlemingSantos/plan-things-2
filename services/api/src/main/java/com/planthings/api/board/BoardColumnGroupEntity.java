package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "board_column_groups")
public class BoardColumnGroupEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false)
  private UUID columnId;

  @Column(nullable = false, length = 120)
  private String title;

  @Column(name = "start_card_id")
  private UUID startCardId;

  @Column(name = "end_card_id")
  private UUID endCardId;

  @Column(nullable = false)
  private Boolean collapsed = false;

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public UUID getColumnId() {
    return columnId;
  }

  public void setColumnId(UUID columnId) {
    this.columnId = columnId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public UUID getStartCardId() {
    return startCardId;
  }

  public void setStartCardId(UUID startCardId) {
    this.startCardId = startCardId;
  }

  public UUID getEndCardId() {
    return endCardId;
  }

  public void setEndCardId(UUID endCardId) {
    this.endCardId = endCardId;
  }

  public Boolean getCollapsed() {
    return collapsed;
  }

  public void setCollapsed(Boolean collapsed) {
    this.collapsed = collapsed;
  }
}
