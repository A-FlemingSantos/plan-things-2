package com.planthings.api.plans;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanRepository extends JpaRepository<PlanEntity, UUID> {

  List<PlanEntity> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);
}
