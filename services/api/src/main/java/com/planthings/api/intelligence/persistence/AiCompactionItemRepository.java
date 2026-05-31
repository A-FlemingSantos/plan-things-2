package com.planthings.api.intelligence.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiCompactionItemRepository extends JpaRepository<AiCompactionItemEntity, UUID> {

  java.util.Optional<AiCompactionItemEntity> findTopByConversationIdAndCompactionModeOrderByCreatedAtDesc(
      UUID conversationId,
      String compactionMode
  );
}
