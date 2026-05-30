package com.planthings.api.intelligence.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiMessageBlockRepository extends JpaRepository<AiMessageBlockEntity, UUID> {

  List<AiMessageBlockEntity> findByMessageIdOrderByPositionAsc(UUID messageId);

  void deleteByMessageId(UUID messageId);
}
