package com.planthings.api.plans;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanMemberRepository extends JpaRepository<PlanMemberEntity, UUID> {

  List<PlanMemberEntity> findByPlanId(UUID planId);

  List<PlanMemberEntity> findByUserId(UUID userId);

  Optional<PlanMemberEntity> findByPlanIdAndUserId(UUID planId, UUID userId);

  boolean existsByPlanIdAndUserId(UUID planId, UUID userId);
}
