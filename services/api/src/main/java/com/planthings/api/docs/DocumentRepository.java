package com.planthings.api.docs;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<DocumentEntity, UUID> {
  List<DocumentEntity> findByIdInOrderByUpdatedAtDesc(Collection<UUID> ids);
}
