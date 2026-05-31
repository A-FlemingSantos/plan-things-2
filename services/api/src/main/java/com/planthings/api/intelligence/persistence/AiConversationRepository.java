package com.planthings.api.intelligence.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiConversationRepository extends JpaRepository<AiConversationEntity, UUID> {

  Optional<AiConversationEntity> findByIdAndCreatedByUserId(UUID id, UUID createdByUserId);

  List<AiConversationEntity> findByWorkspaceIdAndCreatedByUserIdOrderByUpdatedAtDesc(UUID workspaceId, UUID createdByUserId);

  List<AiConversationEntity> findByWorkspaceIdAndCreatedByUserIdAndStatusOrderByUpdatedAtDesc(
      UUID workspaceId,
      UUID createdByUserId,
      com.planthings.api.intelligence.model.AiConversationStatus status
  );
}
