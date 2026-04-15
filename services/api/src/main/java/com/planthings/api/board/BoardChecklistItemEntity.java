package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "board_checklist_items")
public class BoardChecklistItemEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID checklistId;

  @Column(nullable = false, length = 240)
  private String title;

  @Column(nullable = false)
  private Boolean completed = false;

  @Column
  private UUID assigneeUserId;

  @Column
  private OffsetDateTime startAt;

  @Column
  private OffsetDateTime dueAt;

  @Column(nullable = false)
  private Integer positionIndex;

  public UUID getChecklistId() {
    return checklistId;
  }

  public void setChecklistId(UUID checklistId) {
    this.checklistId = checklistId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public Boolean getCompleted() {
    return completed;
  }

  public void setCompleted(Boolean completed) {
    this.completed = completed;
  }

  public UUID getAssigneeUserId() {
    return assigneeUserId;
  }

  public void setAssigneeUserId(UUID assigneeUserId) {
    this.assigneeUserId = assigneeUserId;
  }

  public OffsetDateTime getStartAt() {
    return startAt;
  }

  public void setStartAt(OffsetDateTime startAt) {
    this.startAt = startAt;
  }

  public OffsetDateTime getDueAt() {
    return dueAt;
  }

  public void setDueAt(OffsetDateTime dueAt) {
    this.dueAt = dueAt;
  }

  public Integer getPositionIndex() {
    return positionIndex;
  }

  public void setPositionIndex(Integer positionIndex) {
    this.positionIndex = positionIndex;
  }
}
