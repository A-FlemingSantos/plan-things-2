package com.planthings.api.github;

import com.planthings.api.common.api.ApiEnvelope;
import java.util.List;
import java.util.UUID;
import org.springframework.util.StringUtils;
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
@RequestMapping("/api/plans/{planId}/board/cards/{cardId}/github-links")
public class CardGitHubController {

  private final CardGitHubService cardGitHubService;

  public CardGitHubController(CardGitHubService cardGitHubService) {
    this.cardGitHubService = cardGitHubService;
  }

  @GetMapping
  public ApiEnvelope<List<GitHubLinkMapper.GitHubLinkedItemView>> listLinks(
      @PathVariable UUID planId,
      @PathVariable UUID cardId
  ) {
    return ApiEnvelope.ok(cardGitHubService.listLinks(planId, cardId));
  }

  @PostMapping
  public ApiEnvelope<GitHubLinkMapper.GitHubLinkedItemView> createLink(
      @PathVariable UUID planId,
      @PathVariable UUID cardId,
      @RequestBody CreateLinkRequest request
  ) {
    if (StringUtils.hasText(request.url())) {
      return ApiEnvelope.ok(cardGitHubService.linkByUrl(planId, cardId, request.url()));
    }
    return ApiEnvelope.ok(cardGitHubService.linkObject(
        planId,
        cardId,
        request.type(),
        request.repo(),
        request.number(),
        request.ref(),
        request.sha(),
        request.url()
    ));
  }

  @DeleteMapping("/{linkId}")
  public ApiEnvelope<CardGitHubService.MessageResponse> unlink(
      @PathVariable UUID planId,
      @PathVariable UUID cardId,
      @PathVariable UUID linkId
  ) {
    cardGitHubService.unlink(planId, cardId, linkId);
    return ApiEnvelope.ok(new CardGitHubService.MessageResponse("Link GitHub removido."));
  }

  @GetMapping("/{linkId}/details")
  // CardModal GitHub tab no longer calls this (summaries use link snapshots).
  // Keep for now; remove or repurpose if no other client needs live PR/branch timelines.
  public ApiEnvelope<CardGitHubService.GitHubLinkDetailsView> getDetails(
      @PathVariable UUID planId,
      @PathVariable UUID cardId,
      @PathVariable UUID linkId,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "30") int perPage
  ) {
    return ApiEnvelope.ok(cardGitHubService.getDetails(planId, cardId, linkId, page, perPage));
  }

  @GetMapping("/{linkId}/diff")
  // CardModal GitHub tab no longer renders commit diffs inline.
  // Keep for now; delete if nothing else consumes it.
  public ApiEnvelope<GitHubApiClient.GitHubCommitDiff> getCommitDiff(
      @PathVariable UUID planId,
      @PathVariable UUID cardId,
      @PathVariable UUID linkId
  ) {
    return ApiEnvelope.ok(cardGitHubService.getCommitDiff(planId, cardId, linkId));
  }

  public record CreateLinkRequest(
      String url,
      String type,
      String repo,
      Integer number,
      String ref,
      String sha
  ) {
  }
}
