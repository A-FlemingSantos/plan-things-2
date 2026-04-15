package com.planthings.api.canvas;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "canvas_documents")
public class CanvasDocumentEntity extends BaseEntity {

  @Column(nullable = false, unique = true)
  private UUID planId;

  @Column(nullable = false)
  private UUID updatedByUserId;

  @Column(nullable = false)
  private Long versionNumber = 0L;

  @Column(nullable = false, columnDefinition = "nvarchar(max)")
  private String documentJson;

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public UUID getUpdatedByUserId() {
    return updatedByUserId;
  }

  public void setUpdatedByUserId(UUID updatedByUserId) {
    this.updatedByUserId = updatedByUserId;
  }

  public Long getVersionNumber() {
    return versionNumber;
  }

  public void setVersionNumber(Long versionNumber) {
    this.versionNumber = versionNumber;
  }

  public String getDocumentJson() {
    return documentJson;
  }

  public void setDocumentJson(String documentJson) {
    this.documentJson = documentJson;
  }
}
