package com.planthings.api.intelligence.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiContextSnapshotRepository extends JpaRepository<AiContextSnapshotEntity, UUID> {

  Optional<AiContextSnapshotEntity> findByMessageId(UUID messageId);
}
