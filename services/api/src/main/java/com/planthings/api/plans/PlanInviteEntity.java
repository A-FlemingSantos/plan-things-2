package com.planthings.api.plans;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "plan_invites")
public class PlanInviteEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false)
  private UUID inviterUserId;

  @Column(length = 160)
  private String invitedEmail;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private PlanMemberRole role;

  @Column(nullable = false, unique = true, length = 120)
  private String token;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private PlanInviteStatus status;

  @Column(nullable = false)
  private OffsetDateTime expiresAt;

  @Column
  private OffsetDateTime respondedAt;

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public UUID getInviterUserId() {
    return inviterUserId;
  }

  public void setInviterUserId(UUID inviterUserId) {
    this.inviterUserId = inviterUserId;
  }

  public String getInvitedEmail() {
    return invitedEmail;
  }

  public void setInvitedEmail(String invitedEmail) {
    this.invitedEmail = invitedEmail;
  }

  public PlanMemberRole getRole() {
    return role;
  }

  public void setRole(PlanMemberRole role) {
    this.role = role;
  }

  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }

  public PlanInviteStatus getStatus() {
    return status;
  }

  public void setStatus(PlanInviteStatus status) {
    this.status = status;
  }

  public OffsetDateTime getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(OffsetDateTime expiresAt) {
    this.expiresAt = expiresAt;
  }

  public OffsetDateTime getRespondedAt() {
    return respondedAt;
  }

  public void setRespondedAt(OffsetDateTime respondedAt) {
    this.respondedAt = respondedAt;
  }
}
