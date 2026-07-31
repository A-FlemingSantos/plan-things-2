package com.planthings.api.github;

import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.settings.GitHubIntegrationProperties;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class GitHubLinkSyncService {

  private static final Logger logger = LoggerFactory.getLogger(GitHubLinkSyncService.class);

  private final BoardCardGitHubLinkRepository linkRepository;
  private final PlanGitHubRepoRepository planGitHubRepoRepository;
  private final BoardCardRepository boardCardRepository;
  private final GitHubAccessTokenService accessTokenService;
  private final GitHubApiClient githubApiClient;
  private final GitHubLinkMapper linkMapper;
  private final GitHubAnchorService anchorService;
  private final GitHubIntegrationProperties properties;
  private final Clock clock;

  public GitHubLinkSyncService(
      BoardCardGitHubLinkRepository linkRepository,
      PlanGitHubRepoRepository planGitHubRepoRepository,
      BoardCardRepository boardCardRepository,
      GitHubAccessTokenService accessTokenService,
      GitHubApiClient githubApiClient,
      GitHubLinkMapper linkMapper,
      GitHubAnchorService anchorService,
      GitHubIntegrationProperties properties,
      Clock clock
  ) {
    this.linkRepository = linkRepository;
    this.planGitHubRepoRepository = planGitHubRepoRepository;
    this.boardCardRepository = boardCardRepository;
    this.accessTokenService = accessTokenService;
    this.githubApiClient = githubApiClient;
    this.linkMapper = linkMapper;
    this.anchorService = anchorService;
    this.properties = properties;
    this.clock = clock;
  }

  @Transactional
  public int syncDueLinks() {
    OffsetDateTime syncBefore = OffsetDateTime.now(clock).minusMinutes(properties.getPollingIntervalMinutes());
    List<BoardCardGitHubLinkEntity> dueLinks = linkRepository.findDueForSync(
        syncBefore,
        PageRequest.of(0, properties.getPollingBatchSize())
    );

    int synced = 0;
    for (BoardCardGitHubLinkEntity link : dueLinks) {
      try {
        syncLink(link);
        synced++;
      } catch (RuntimeException exception) {
        logger.warn("GitHub link sync failed linkId={}", link.getId(), exception);
      }
    }
    return synced;
  }

  @Transactional
  public void syncLink(BoardCardGitHubLinkEntity link) {
    if (Boolean.TRUE.equals(link.getUnavailable())) {
      link.setLastSyncedAt(OffsetDateTime.now(clock));
      linkRepository.save(link);
      return;
    }

    PlanGitHubRepoEntity planRepo = planGitHubRepoRepository.findById(link.getPlanGithubRepoId()).orElse(null);
    if (planRepo == null || planRepo.getRemovedAt() != null) {
      link.setUnavailable(true);
      link.setLastSyncedAt(OffsetDateTime.now(clock));
      linkRepository.save(link);
      return;
    }

    String accessToken;
    try {
      accessToken = accessTokenService.requireActiveAccessToken(planRepo.getConnectionUserId());
    } catch (BadRequestException exception) {
      link.setUnavailable(true);
      link.setLastSyncedAt(OffsetDateTime.now(clock));
      linkRepository.save(link);
      return;
    }

    String[] parts = link.getRepoFullName().split("/", 2);
    refreshFromGitHub(link, accessToken, parts[0], parts[1]);
    link.setLastSyncedAt(OffsetDateTime.now(clock));
    linkRepository.save(link);
    applyCompletionIfNeeded(link);
  }

  @Transactional
  public void applyCompletionIfNeeded(BoardCardGitHubLinkEntity link) {
    if (!Boolean.TRUE.equals(link.getCompletionAnchor())) {
      return;
    }
    if (!anchorService.shouldCompleteCard(link)) {
      return;
    }

    BoardCardEntity card = boardCardRepository.findById(link.getCardId()).orElse(null);
    if (card == null || Boolean.TRUE.equals(card.getCompleted())) {
      return;
    }

    card.setCompleted(true);
    boardCardRepository.save(card);
  }

  private void refreshFromGitHub(BoardCardGitHubLinkEntity link, String accessToken, String owner, String repo) {
    switch (link.getLinkType()) {
      case ISSUE -> {
        GitHubApiClient.GitHubRefreshResult<GitHubApiClient.GitHubIssue> refresh = githubApiClient.refreshIssue(
            accessToken,
            owner,
            repo,
            link.getGithubNumber(),
            link.getSyncEtag()
        );
        if (refresh.notModified()) {
          link.setSyncEtag(refresh.etag());
          return;
        }
        GitHubApiClient.GitHubIssue issue = refresh.payload();
        link.setSyncEtag(refresh.etag());
        link.setTitle(issue.title());
        link.setStatus(linkMapper.mapIssueStatus(issue.state()));
        link.setSnapshotJson(linkMapper.buildSnapshotJson(issue));
      }
      case PULL_REQUEST -> {
        GitHubApiClient.GitHubRefreshResult<GitHubApiClient.GitHubPullRequest> refresh = githubApiClient.refreshPullRequest(
            accessToken,
            owner,
            repo,
            link.getGithubNumber(),
            link.getSyncEtag()
        );
        if (refresh.notModified()) {
          link.setSyncEtag(refresh.etag());
          return;
        }
        GitHubApiClient.GitHubPullRequest pullRequest = refresh.payload();
        link.setSyncEtag(refresh.etag());
        link.setTitle(pullRequest.title());
        link.setStatus(linkMapper.mapPullRequestStatus(pullRequest));
        link.setSnapshotJson(linkMapper.buildSnapshotJson(pullRequest));
      }
      case BRANCH -> {
        if (!StringUtils.hasText(link.getGithubRef())) {
          return;
        }
        GitHubApiClient.GitHubRefreshResult<GitHubApiClient.GitHubBranch> refresh = githubApiClient.refreshBranch(
            accessToken,
            owner,
            repo,
            link.getGithubRef(),
            link.getSyncEtag()
        );
        if (refresh.notModified()) {
          link.setSyncEtag(refresh.etag());
          return;
        }
        GitHubApiClient.GitHubBranch branch = refresh.payload();
        link.setSyncEtag(refresh.etag());
        link.setTitle(branch.name());
        link.setStatus("open");
        link.setSnapshotJson(linkMapper.buildSnapshotJson(branch));
      }
      case COMMIT -> {
        if (!StringUtils.hasText(link.getGithubSha())) {
          return;
        }
        GitHubApiClient.GitHubRefreshResult<GitHubApiClient.GitHubCommit> refresh = githubApiClient.refreshCommit(
            accessToken,
            owner,
            repo,
            link.getGithubSha(),
            link.getSyncEtag()
        );
        if (refresh.notModified()) {
          link.setSyncEtag(refresh.etag());
          return;
        }
        GitHubApiClient.GitHubCommit commit = refresh.payload();
        link.setSyncEtag(refresh.etag());
        link.setTitle(commit.message().split("\n")[0]);
        link.setSnapshotJson(linkMapper.buildSnapshotJson(commit));
      }
    }
  }
}
