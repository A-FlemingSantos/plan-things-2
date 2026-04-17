package com.planthings.api.plans;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "plans")
public class PlanEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID workspaceId;

  @Column(nullable = false)
  private UUID ownerUserId;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(length = 400)
  private String description;

  @Column(length = 60)
  private String coverThemeId;

  @Column(length = 20)
  private String coverColor;

  @Column(length = 255)
  private String coverImageId;

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public void setWorkspaceId(UUID workspaceId) {
    this.workspaceId = workspaceId;
  }

  public UUID getOwnerUserId() {
    return ownerUserId;
  }

  public void setOwnerUserId(UUID ownerUserId) {
    this.ownerUserId = ownerUserId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getCoverThemeId() {
    return coverThemeId;
  }

  public void setCoverThemeId(String coverThemeId) {
    this.coverThemeId = coverThemeId;
  }

  public String getCoverColor() {
    return coverColor;
  }

  public void setCoverColor(String coverColor) {
    this.coverColor = coverColor;
  }

  public String getCoverImageId() {
    return coverImageId;
  }

  public void setCoverImageId(String coverImageId) {
    this.coverImageId = coverImageId;
  }
}
