package com.planthings.api.files;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "file_blobs")
public class FileBlobEntity extends BaseEntity {

  @Column(nullable = false, unique = true)
  private UUID fileEntryId;

  @Lob
  @Column(nullable = false)
  private byte[] content;

  public UUID getFileEntryId() {
    return fileEntryId;
  }

  public void setFileEntryId(UUID fileEntryId) {
    this.fileEntryId = fileEntryId;
  }

  public byte[] getContent() {
    return content;
  }

  public void setContent(byte[] content) {
    this.content = content;
  }
}
