package com.planthings.api.canvas;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CanvasDocumentRepository extends JpaRepository<CanvasDocumentEntity, UUID> {

  Optional<CanvasDocumentEntity> findByPlanId(UUID planId);
}
