package com.planthings.api.files;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "file_entries")
public class FileEntryEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID workspaceId;

  @Column(nullable = false)
  private UUID ownerUserId;

  @Column
  private UUID parentId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private FileEntryType type;

  @Column(nullable = false, length = 255)
  private String name;

  @Column(length = 120)
  private String mimeType;

  @Column
  private Long sizeBytes;

  @Column
  private OffsetDateTime deletedAt;

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

  public UUID getParentId() {
    return parentId;
  }

  public void setParentId(UUID parentId) {
    this.parentId = parentId;
  }

  public FileEntryType getType() {
    return type;
  }

  public void setType(FileEntryType type) {
    this.type = type;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public Long getSizeBytes() {
    return sizeBytes;
  }

  public void setSizeBytes(Long sizeBytes) {
    this.sizeBytes = sizeBytes;
  }

  public OffsetDateTime getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(OffsetDateTime deletedAt) {
    this.deletedAt = deletedAt;
  }
}
