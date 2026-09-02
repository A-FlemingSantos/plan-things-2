package com.planthings.api.plans;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanRepository extends JpaRepository<PlanEntity, UUID> {

  List<PlanEntity> findByWorkspaceIdOrderByCreatedAtDesc(UUID workspaceId);

  Optional<PlanEntity> findBySlugIgnoreCase(String slug);

  boolean existsBySlugIgnoreCase(String slug);
}
