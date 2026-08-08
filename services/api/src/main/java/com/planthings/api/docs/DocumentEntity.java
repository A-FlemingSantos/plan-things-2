package com.planthings.api.docs;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "documents")
public class DocumentEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID ownerUserId;

  @Column(nullable = false)
  private UUID updatedByUserId;

  @Column(nullable = false, length = 160)
  private String title;

  @Column(length = 400)
  private String description;

  @Column(nullable = false, columnDefinition = "nvarchar(max)")
  private String contentMarkdown;

  @Column(nullable = false)
  private long versionNumber;

  public UUID getOwnerUserId() {
    return ownerUserId;
  }

  public void setOwnerUserId(UUID ownerUserId) {
    this.ownerUserId = ownerUserId;
  }

  public UUID getUpdatedByUserId() {
    return updatedByUserId;
  }

  public void setUpdatedByUserId(UUID updatedByUserId) {
    this.updatedByUserId = updatedByUserId;
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

  public String getContentMarkdown() {
    return contentMarkdown;
  }

  public void setContentMarkdown(String contentMarkdown) {
    this.contentMarkdown = contentMarkdown;
  }

  public long getVersionNumber() {
    return versionNumber;
  }

  public void setVersionNumber(long versionNumber) {
    this.versionNumber = versionNumber;
  }
}
