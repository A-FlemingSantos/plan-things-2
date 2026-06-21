package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "board_columns")
public class BoardColumnEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false, length = 120)
  private String title;

  @Column(nullable = false, length = 20)
  private String color;

  @Column(nullable = false, length = 32)
  private String status;

  @Column(nullable = false)
  private Integer positionIndex;

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getColor() {
    return color;
  }

  public void setColor(String color) {
    this.color = color;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Integer getPositionIndex() {
    return positionIndex;
  }

  public void setPositionIndex(Integer positionIndex) {
    this.positionIndex = positionIndex;
  }
}
