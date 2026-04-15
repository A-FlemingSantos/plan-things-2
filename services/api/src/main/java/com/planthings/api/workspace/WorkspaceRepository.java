package com.planthings.api.workspace;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceRepository extends JpaRepository<WorkspaceEntity, UUID> {

  Optional<WorkspaceEntity> findByOwnerUserId(UUID ownerUserId);
}
