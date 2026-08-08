package com.planthings.api.docs;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentMemberRepository extends JpaRepository<DocumentMemberEntity, UUID> {
  List<DocumentMemberEntity> findByDocumentId(UUID documentId);

  List<DocumentMemberEntity> findByUserId(UUID userId);

  Optional<DocumentMemberEntity> findByDocumentIdAndUserId(UUID documentId, UUID userId);

  boolean existsByDocumentIdAndUserId(UUID documentId, UUID userId);
}
