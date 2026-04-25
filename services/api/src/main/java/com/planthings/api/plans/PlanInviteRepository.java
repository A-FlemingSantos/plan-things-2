package com.planthings.api.plans;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanInviteRepository extends JpaRepository<PlanInviteEntity, UUID> {

  List<PlanInviteEntity> findByPlanIdOrderByCreatedAtDesc(UUID planId);

  List<PlanInviteEntity> findByInvitedEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(String invitedEmail, PlanInviteStatus status);

  Optional<PlanInviteEntity> findByToken(String token);

  Optional<PlanInviteEntity> findByPlanIdAndInvitedEmailIgnoreCaseAndStatus(UUID planId, String invitedEmail, PlanInviteStatus status);
}
