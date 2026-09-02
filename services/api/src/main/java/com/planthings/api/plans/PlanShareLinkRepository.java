package com.planthings.api.plans;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanShareLinkRepository extends JpaRepository<PlanShareLinkEntity, UUID> {

  Optional<PlanShareLinkEntity> findByToken(String token);

  Optional<PlanShareLinkEntity> findByPlanIdAndRevokedAtIsNull(UUID planId);
}
