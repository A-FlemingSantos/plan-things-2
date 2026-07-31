package com.planthings.api.github;

import com.planthings.api.common.api.ApiEnvelope;
import com.planthings.api.settings.GitHubIntegrationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/plans/{planId}/github")
public class PlanGitHubController {

  private final PlanGitHubService planGitHubService;

  public PlanGitHubController(PlanGitHubService planGitHubService) {
    this.planGitHubService = planGitHubService;
  }

  @GetMapping("/repositories")
  public ApiEnvelope<List<PlanGitHubService.ConnectedGitHubRepoView>> listConnectedRepositories(@PathVariable UUID planId) {
    return ApiEnvelope.ok(planGitHubService.getStatus(planId).connectedRepos());
  }

  @PostMapping("/repositories")
  public ApiEnvelope<PlanGitHubService.ConnectRepositoryResult> connectRepository(
      @PathVariable UUID planId,
      @Valid @RequestBody PlanGitHubService.ConnectRepositoryRequest request
  ) {
    return ApiEnvelope.ok(planGitHubService.connectRepository(planId, request));
  }

  @DeleteMapping("/repositories/{repoLinkId}")
  public ApiEnvelope<PlanGitHubService.ConnectedGitHubRepoView> removeRepository(
      @PathVariable UUID planId,
      @PathVariable UUID repoLinkId
  ) {
    return ApiEnvelope.ok(planGitHubService.removeRepository(planId, repoLinkId));
  }

  @GetMapping("/objects")
  public ApiEnvelope<List<GitHubLinkMapper.GitHubLinkedItemView>> searchObjects(
      @PathVariable UUID planId,
      @RequestParam String type,
      @RequestParam String repo,
      @RequestParam(required = false) String q
  ) {
    return ApiEnvelope.ok(planGitHubService.searchObjects(planId, type, repo, q));
  }

  @GetMapping("/commit-diff")
  // Was used by CardModal search-result commit previews; panel now links out to GitHub.
  // Keep for now; delete if nothing else consumes it.
  public ApiEnvelope<GitHubApiClient.GitHubCommitDiff> getCommitDiff(
      @PathVariable UUID planId,
      @RequestParam String repo,
      @RequestParam String sha
  ) {
    return ApiEnvelope.ok(planGitHubService.getCommitDiff(planId, repo, sha));
  }
}
