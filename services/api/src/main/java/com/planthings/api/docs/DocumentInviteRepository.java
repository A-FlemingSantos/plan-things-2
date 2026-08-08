package com.planthings.api.docs;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentInviteRepository extends JpaRepository<DocumentInviteEntity, UUID> {
  Optional<DocumentInviteEntity> findByToken(String token);

  Optional<DocumentInviteEntity> findByDocumentIdAndInvitedEmailIgnoreCaseAndStatus(
      UUID documentId,
      String invitedEmail,
      DocumentInviteStatus status
  );
}
