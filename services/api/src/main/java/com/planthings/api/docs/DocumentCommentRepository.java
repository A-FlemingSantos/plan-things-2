package com.planthings.api.docs;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentCommentRepository extends JpaRepository<DocumentCommentEntity, UUID> {
  List<DocumentCommentEntity> findByDocumentIdOrderByCreatedAtAsc(UUID documentId);
}
