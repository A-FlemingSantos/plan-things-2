package com.planthings.api.files;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileEntryRepository extends JpaRepository<FileEntryEntity, UUID> {

  List<FileEntryEntity> findByWorkspaceIdAndOwnerUserIdAndDeletedAtIsNullOrderByTypeAscNameAsc(UUID workspaceId, UUID ownerUserId);

  List<FileEntryEntity> findByWorkspaceIdAndOwnerUserId(UUID workspaceId, UUID ownerUserId);

  List<FileEntryEntity> findByWorkspaceIdAndDeletedAtIsNullOrderByTypeAscNameAsc(UUID workspaceId);

  List<FileEntryEntity> findByWorkspaceIdAndDeletedAtIsNotNullOrderByUpdatedAtDesc(UUID workspaceId);
}
