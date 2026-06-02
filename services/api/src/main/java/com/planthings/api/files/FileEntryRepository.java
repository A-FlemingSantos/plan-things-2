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
      select entry
      from FileEntryEntity entry
      where entry.workspaceId = :workspaceId
        and entry.deletedAt is null
        and entry.type = com.planthings.api.files.FileEntryType.FILE
        and (
          entry.ownerUserId = :userId
          or exists (
            select share.id
            from FilePlanShareEntity share
            where share.fileEntryId = entry.id
              and exists (
                select member.id
                from PlanMemberEntity member
                where member.planId = share.planId
                  and member.userId = :userId
              )
          )
        )
        and (
          :query = ''
          or lower(entry.name) like lower(concat('%', :query, '%'))
          or lower(coalesce(entry.mimeType, '')) like lower(concat('%', :query, '%'))
        )
      order by entry.updatedAt desc
      """)
  List<FileEntryEntity> searchFilesByWorkspaceId(
      @Param("workspaceId") UUID workspaceId,
      @Param("userId") UUID userId,
      @Param("query") String query,
      org.springframework.data.domain.Pageable pageable
  );

  @Query("""
      select entry
      from FileEntryEntity entry
      where entry.id in :fileIds
        and entry.deletedAt is null
        and entry.type = com.planthings.api.files.FileEntryType.FILE
        and (
          :query = ''
          or lower(entry.name) like lower(concat('%', :query, '%'))
          or lower(coalesce(entry.mimeType, '')) like lower(concat('%', :query, '%'))
        )
      order by entry.updatedAt desc
      """)
  List<FileEntryEntity> searchFilesByIds(
      @Param("fileIds") List<UUID> fileIds,
      @Param("query") String query,
      org.springframework.data.domain.Pageable pageable
  );

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
