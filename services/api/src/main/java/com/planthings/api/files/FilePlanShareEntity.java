package com.planthings.api.files;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "file_plan_shares")
public class FilePlanShareEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID fileEntryId;

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false)
  private UUID sharedByUserId;

  public UUID getFileEntryId() {
    return fileEntryId;
  }

  public void setFileEntryId(UUID fileEntryId) {
    this.fileEntryId = fileEntryId;
  }

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public UUID getSharedByUserId() {
    return sharedByUserId;
  }

  public void setSharedByUserId(UUID sharedByUserId) {
    this.sharedByUserId = sharedByUserId;
  }
}
