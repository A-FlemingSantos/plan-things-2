package com.planthings.api.files;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardAttachmentRepository extends JpaRepository<CardAttachmentEntity, UUID> {

  List<CardAttachmentEntity> findByCardId(UUID cardId);
}
