package com.planthings.api.plans;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanLabelRepository extends JpaRepository<PlanLabelEntity, UUID> {

  List<PlanLabelEntity> findByPlanIdOrderByNameAsc(UUID planId);
}
