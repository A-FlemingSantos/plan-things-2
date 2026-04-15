package com.planthings.api.calendar;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "calendar_events")
public class CalendarEventEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID workspaceId;

  @Column(nullable = false)
  private UUID creatorUserId;

  @Column
  private UUID planId;

  @Column
  private UUID linkedCardId;

  @Column(nullable = false, length = 160)
  private String title;

  @Column(length = 2000)
  private String description;

  @Column(length = 255)
  private String location;

  @Column(nullable = false)
  private OffsetDateTime startsAt;

  @Column(nullable = false)
  private OffsetDateTime endsAt;

  @Column(nullable = false)
  private Boolean generatedFromCard = false;

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public void setWorkspaceId(UUID workspaceId) {
    this.workspaceId = workspaceId;
  }

  public UUID getCreatorUserId() {
    return creatorUserId;
  }

  public void setCreatorUserId(UUID creatorUserId) {
    this.creatorUserId = creatorUserId;
  }

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public UUID getLinkedCardId() {
    return linkedCardId;
  }

  public void setLinkedCardId(UUID linkedCardId) {
    this.linkedCardId = linkedCardId;
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

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public OffsetDateTime getStartsAt() {
    return startsAt;
  }

  public void setStartsAt(OffsetDateTime startsAt) {
    this.startsAt = startsAt;
  }

  public OffsetDateTime getEndsAt() {
    return endsAt;
  }

  public void setEndsAt(OffsetDateTime endsAt) {
    this.endsAt = endsAt;
  }

  public Boolean getGeneratedFromCard() {
    return generatedFromCard;
  }

  public void setGeneratedFromCard(Boolean generatedFromCard) {
    this.generatedFromCard = generatedFromCard;
  }
}
