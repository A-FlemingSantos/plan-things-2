package com.planthings.api.intelligence.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiMessageRepository extends JpaRepository<AiMessageEntity, UUID> {

  List<AiMessageEntity> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);
}
