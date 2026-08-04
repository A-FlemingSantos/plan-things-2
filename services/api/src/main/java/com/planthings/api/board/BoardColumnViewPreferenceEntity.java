package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(
    name = "board_column_view_preferences",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_board_column_view_preferences_user_plan_column",
        columnNames = {"user_id", "plan_id", "column_id"}
    )
)
public class BoardColumnViewPreferenceEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID userId;

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false)
  private UUID columnId;

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

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
}
