package com.planthings.api.github;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanGitHubRepoRepository extends JpaRepository<PlanGitHubRepoEntity, UUID> {

  List<PlanGitHubRepoEntity> findByPlanIdAndRemovedAtIsNullOrderByConnectedAtAsc(UUID planId);

  Optional<PlanGitHubRepoEntity> findByPlanIdAndGithubRepoIdAndRemovedAtIsNull(UUID planId, Long githubRepoId);

  Optional<PlanGitHubRepoEntity> findByPlanIdAndGithubRepoId(UUID planId, Long githubRepoId);

  Optional<PlanGitHubRepoEntity> findByIdAndPlanIdAndRemovedAtIsNull(UUID id, UUID planId);

  Optional<PlanGitHubRepoEntity> findByPlanIdAndRepoFullNameIgnoreCaseAndRemovedAtIsNull(UUID planId, String repoFullName);

  List<PlanGitHubRepoEntity> findByConnectionUserIdAndRemovedAtIsNull(UUID connectionUserId);
}
