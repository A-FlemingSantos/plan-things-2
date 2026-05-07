package com.planthings.api.files;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FileEntryRepository extends JpaRepository<FileEntryEntity, UUID> {

  List<FileEntryEntity> findByWorkspaceIdAndOwnerUserIdAndDeletedAtIsNullOrderByTypeAscNameAsc(UUID workspaceId, UUID ownerUserId);

  List<FileEntryEntity> findByWorkspaceIdAndOwnerUserId(UUID workspaceId, UUID ownerUserId);

  List<FileEntryEntity> findByWorkspaceIdAndDeletedAtIsNullOrderByTypeAscNameAsc(UUID workspaceId);

  List<FileEntryEntity> findByWorkspaceIdAndDeletedAtIsNotNullOrderByUpdatedAtDesc(UUID workspaceId);

  @Query("""
      select coalesce(sum(entry.sizeBytes), 0)
      from FileEntryEntity entry
      where entry.workspaceId = :workspaceId
        and entry.deletedAt is null
        and entry.type = com.planthings.api.files.FileEntryType.FILE
        and entry.sizeBytes is not null
      """)
  long sumActiveFileSizeBytes(@Param("workspaceId") UUID workspaceId);
}
