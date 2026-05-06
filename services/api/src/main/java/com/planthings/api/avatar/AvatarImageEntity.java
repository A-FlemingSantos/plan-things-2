package com.planthings.api.avatar;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

@Entity
@Table(
    name = "avatar_images",
    uniqueConstraints = @UniqueConstraint(name = "uq_avatar_images_owner", columnNames = {"owner_type", "owner_id"})
)
public class AvatarImageEntity extends BaseEntity {

  @Enumerated(EnumType.STRING)
  @Column(name = "owner_type", nullable = false, length = 30)
  private AvatarOwnerType ownerType;

  @Column(name = "owner_id", nullable = false)
  private UUID ownerId;

  @Column(name = "mime_type", nullable = false, length = 80)
  private String mimeType;

  @Lob
  @Column(nullable = false)
  private byte[] content;

  public AvatarOwnerType getOwnerType() {
    return ownerType;
  }

  public void setOwnerType(AvatarOwnerType ownerType) {
    this.ownerType = ownerType;
  }

  public UUID getOwnerId() {
    return ownerId;
  }

  public void setOwnerId(UUID ownerId) {
    this.ownerId = ownerId;
  }

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public byte[] getContent() {
    return content;
  }

  public void setContent(byte[] content) {
    this.content = content;
  }
}

