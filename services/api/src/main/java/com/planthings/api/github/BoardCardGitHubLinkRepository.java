package com.planthings.api.github;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardCardGitHubLinkRepository extends JpaRepository<BoardCardGitHubLinkEntity, UUID> {

  List<BoardCardGitHubLinkEntity> findByCardIdOrderByCreatedAtAsc(UUID cardId);

  Optional<BoardCardGitHubLinkEntity> findByIdAndCardId(UUID id, UUID cardId);

  Optional<BoardCardGitHubLinkEntity> findByCardIdAndCompletionAnchorTrue(UUID cardId);

  List<BoardCardGitHubLinkEntity> findByCardIdAndLinkTypeInOrderByCreatedAtAsc(
      UUID cardId,
      List<GitHubLinkType> linkTypes
  );

  @Query("""
      select link from BoardCardGitHubLinkEntity link
      where link.unavailable = false
        and (link.lastSyncedAt is null or link.lastSyncedAt < :syncBefore)
      order by link.lastSyncedAt asc
      """)
  List<BoardCardGitHubLinkEntity> findDueForSync(@Param("syncBefore") OffsetDateTime syncBefore, Pageable pageable);

  List<BoardCardGitHubLinkEntity> findByPlanGithubRepoId(UUID planGithubRepoId);
}
