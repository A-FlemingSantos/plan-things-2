package com.planthings.api.docs;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentRepository extends JpaRepository<DocumentEntity, UUID> {
  List<DocumentEntity> findByIdInOrderByUpdatedAtDesc(Collection<UUID> ids);

  @Query("""
      select case when count(document) > 0 then true else false end
      from DocumentEntity document, DocumentMemberEntity member
      where document.id = member.documentId
        and member.userId = :userId
        and document.coverImageId = :coverImageId
      """)
  boolean existsCoverAccessibleToUser(
      @Param("coverImageId") String coverImageId,
      @Param("userId") UUID userId
  );
}
