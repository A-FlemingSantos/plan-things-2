package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "board_cards")
public class BoardCardEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false)
  private UUID columnId;

  @Column(name = "group_id")
  private UUID groupId;

  @Column(nullable = false)
  private UUID authorUserId;

  @Column(nullable = false, length = 160)
  private String title;

  @Column(length = 4000)
  private String description;

  @Column
  private UUID labelId;

  @Column(nullable = false)
  private Integer positionIndex;

  @Column(nullable = false)
  private Boolean completed = false;

  @Column(name = "is_starred", nullable = false)
  private Boolean starred = false;

  @Column
  private OffsetDateTime startAt;

  @Column
  private OffsetDateTime dueAt;

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

  public UUID getGroupId() {
    return groupId;
  }

  public void setGroupId(UUID groupId) {
    this.groupId = groupId;
  }

  public UUID getAuthorUserId() {
    return authorUserId;
  }

  public void setAuthorUserId(UUID authorUserId) {
    this.authorUserId = authorUserId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public UUID getLabelId() {
    return labelId;
  }

  public void setLabelId(UUID labelId) {
    this.labelId = labelId;
  }

  public Integer getPositionIndex() {
    return positionIndex;
  }

  public void setPositionIndex(Integer positionIndex) {
    this.positionIndex = positionIndex;
  }

  public Boolean getCompleted() {
    return completed;
  }

  public void setCompleted(Boolean completed) {
    this.completed = completed;
  }

  public Boolean getStarred() {
    return starred;
  }

  public void setStarred(Boolean starred) {
    this.starred = starred;
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
}
