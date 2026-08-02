package com.planthings.api.github;

import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.plans.PlanAccessService;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CardGitHubService {

  private final PlanAccessService planAccessService;
  private final AuthenticatedUserService authenticatedUserService;
  private final BoardCardRepository boardCardRepository;
  private final BoardCardGitHubLinkRepository linkRepository;
  private final PlanGitHubService planGitHubService;
  private final PlanGitHubRepoRepository planGitHubRepoRepository;
  private final GitHubAccessTokenService accessTokenService;
  private final GitHubApiClient githubApiClient;
  private final GitHubUrlParser urlParser;
  private final GitHubLinkMapper linkMapper;
  private final GitHubAnchorService anchorService;
  private final GitHubLinkSyncService linkSyncService;
  private final Clock clock;

  public CardGitHubService(
      PlanAccessService planAccessService,
      AuthenticatedUserService authenticatedUserService,
      BoardCardRepository boardCardRepository,
      BoardCardGitHubLinkRepository linkRepository,
      PlanGitHubService planGitHubService,
      PlanGitHubRepoRepository planGitHubRepoRepository,
      GitHubAccessTokenService accessTokenService,
      GitHubApiClient githubApiClient,
      GitHubUrlParser urlParser,
      GitHubLinkMapper linkMapper,
      GitHubAnchorService anchorService,
      GitHubLinkSyncService linkSyncService,
      Clock clock
  ) {
    this.planAccessService = planAccessService;
    this.authenticatedUserService = authenticatedUserService;
    this.boardCardRepository = boardCardRepository;
    this.linkRepository = linkRepository;
    this.planGitHubService = planGitHubService;
    this.planGitHubRepoRepository = planGitHubRepoRepository;
    this.accessTokenService = accessTokenService;
    this.githubApiClient = githubApiClient;
    this.urlParser = urlParser;
    this.linkMapper = linkMapper;
    this.anchorService = anchorService;
    this.linkSyncService = linkSyncService;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public CardGitHubPanelView getPanel(UUID planId, UUID cardId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);
    requireCard(planId, cardId);

    PlanGitHubService.PlanGitHubStatus planStatus = planGitHubService.getStatus(planId);
    List<GitHubLinkMapper.GitHubLinkedItemView> links = linkRepository.findByCardIdOrderByCreatedAtAsc(cardId).stream()
        .map(linkMapper::toLinkedItemView)
        .toList();

    return new CardGitHubPanelView(
        planStatus.manager(),
        planStatus.userGitHubConnected(),
        !planStatus.connectedRepos().isEmpty(),
        planStatus.connectedRepos().stream().map(PlanGitHubService.ConnectedGitHubRepoView::fullName).toList(),
        links
    );
  }

  @Transactional(readOnly = true)
  public List<GitHubLinkMapper.GitHubLinkedItemView> listLinks(UUID planId, UUID cardId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);
    requireCard(planId, cardId);
    return linkRepository.findByCardIdOrderByCreatedAtAsc(cardId).stream()
        .map(linkMapper::toLinkedItemView)
        .toList();
  }

  @Transactional
  public GitHubLinkMapper.GitHubLinkedItemView linkByUrl(UUID planId, UUID cardId, String url) {
    GitHubUrlParser.ParsedGitHubUrl parsed = urlParser.parse(url);
    return createLink(planId, cardId, parsed.type(), parsed.repoFullName(), parsed.number(), parsed.ref(), parsed.sha(), parsed.url());
  }

  @Transactional
  public GitHubLinkMapper.GitHubLinkedItemView linkObject(
      UUID planId,
      UUID cardId,
      String type,
      String repoFullName,
      Integer number,
      String ref,
      String sha,
      String explicitUrl
  ) {
    if (!StringUtils.hasText(repoFullName)) {
      throw new BadRequestException("GITHUB_REPO_OBRIGATORIO", "Informe o repositorio do plano.");
    }
    GitHubLinkType linkType = GitHubLinkType.fromApiValue(type);
    return createLink(planId, cardId, linkType, repoFullName, number, ref, sha, explicitUrl);
  }

  @Transactional
  public void unlink(UUID planId, UUID cardId, UUID linkId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanManager(planId, currentUserId);
    requireCard(planId, cardId);

    BoardCardGitHubLinkEntity link = linkRepository.findByIdAndCardId(linkId, cardId)
        .orElseThrow(() -> new NotFoundException("GITHUB_LINK_NAO_ENCONTRADO", "Nao encontramos este link GitHub."));

    boolean wasAnchor = Boolean.TRUE.equals(link.getCompletionAnchor());
    linkRepository.delete(link);

    if (wasAnchor) {
      anchorService.promoteNextAnchor(cardId);
    }
  }

  private GitHubLinkMapper.GitHubLinkedItemView createLink(
      UUID planId,
      UUID cardId,
      GitHubLinkType linkType,
      String repoFullName,
      Integer number,
      String ref,
      String sha,
      String explicitUrl
  ) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanManager(planId, currentUserId);
    requireCard(planId, cardId);

    PlanGitHubRepoEntity planRepo = planGitHubService.requireActivePlanRepo(planId, repoFullName);
    String accessToken = accessTokenService.requireActiveAccessToken(planRepo.getConnectionUserId());
    String[] parts = repoFullName.split("/", 2);

    BoardCardGitHubLinkEntity link = new BoardCardGitHubLinkEntity();
    link.setPlanId(planId);
    link.setCardId(cardId);
    link.setPlanGithubRepoId(planRepo.getId());
    link.setLinkType(linkType);
    link.setRepoFullName(repoFullName);
    link.setLinkedByUserId(currentUserId);
    link.setUnavailable(false);
    link.setLastSyncedAt(OffsetDateTime.now(clock));

    populateFromGitHub(link, accessToken, parts[0], parts[1], number, ref, sha, explicitUrl);
    anchorService.assignAnchorOnCreate(link);
    BoardCardGitHubLinkEntity saved = linkRepository.save(link);
    linkSyncService.applyCompletionIfNeeded(saved);
    return linkMapper.toLinkedItemView(saved);
  }

  private void populateFromGitHub(
      BoardCardGitHubLinkEntity link,
      String accessToken,
      String owner,
      String repo,
      Integer number,
      String ref,
      String sha,
      String explicitUrl
  ) {
    switch (link.getLinkType()) {
      case ISSUE -> {
        if (number == null) {
          throw new BadRequestException("GITHUB_NUMERO_OBRIGATORIO", "Informe o numero da issue.");
        }
        GitHubApiClient.GitHubIssue issue = githubApiClient.getIssue(accessToken, owner, repo, number);
        link.setGithubNumber(issue.number());
        link.setTitle(issue.title());
        link.setUrl(StringUtils.hasText(explicitUrl) ? explicitUrl : issue.htmlUrl());
        link.setStatus(linkMapper.mapIssueStatus(issue.state()));
        link.setSnapshotJson(linkMapper.buildSnapshotJson(issue));
      }
      case PULL_REQUEST -> {
        if (number == null) {
          throw new BadRequestException("GITHUB_NUMERO_OBRIGATORIO", "Informe o numero do pull request.");
        }
        GitHubApiClient.GitHubPullRequest pullRequest = githubApiClient.getPullRequest(accessToken, owner, repo, number);
        link.setGithubNumber(pullRequest.number());
        link.setTitle(pullRequest.title());
        link.setUrl(StringUtils.hasText(explicitUrl) ? explicitUrl : pullRequest.htmlUrl());
        link.setStatus(linkMapper.mapPullRequestStatus(pullRequest));
        link.setSnapshotJson(linkMapper.buildSnapshotJson(pullRequest));
      }
      case BRANCH -> {
        if (!StringUtils.hasText(ref)) {
          throw new BadRequestException("GITHUB_REF_OBRIGATORIO", "Informe o nome da branch.");
        }
        GitHubApiClient.GitHubBranch branch = githubApiClient.getBranch(accessToken, owner, repo, ref);
        link.setGithubRef(branch.name());
        link.setTitle(branch.name());
        link.setUrl(StringUtils.hasText(explicitUrl) ? explicitUrl : branch.htmlUrl());
        link.setStatus("open");
        link.setSnapshotJson(linkMapper.buildSnapshotJson(branch));
      }
      case COMMIT -> {
        if (!StringUtils.hasText(sha)) {
          throw new BadRequestException("GITHUB_SHA_OBRIGATORIO", "Informe o SHA do commit.");
        }
        GitHubApiClient.GitHubCommit commit = githubApiClient.getCommit(accessToken, owner, repo, sha);
        link.setGithubSha(commit.sha());
        link.setTitle(commit.message().split("\n")[0]);
        link.setUrl(StringUtils.hasText(explicitUrl) ? explicitUrl : commit.htmlUrl());
        link.setStatus(null);
        link.setSnapshotJson(linkMapper.buildSnapshotJson(commit));
      }
    }
  }

  private BoardCardEntity requireCard(UUID planId, UUID cardId) {
    BoardCardEntity card = boardCardRepository.findById(cardId)
        .orElseThrow(() -> new NotFoundException("CARTAO_NAO_ENCONTRADO", "Nao encontramos o cartao informado."));
    if (!planId.equals(card.getPlanId())) {
      throw new NotFoundException("CARTAO_NAO_ENCONTRADO", "Nao encontramos o cartao informado.");
    }
    return card;
  }

  public record CardGitHubPanelView(
      boolean manager,
      boolean userGitHubConnected,
      boolean planHasRepos,
      List<String> availableRepoFullNames,
      List<GitHubLinkMapper.GitHubLinkedItemView> linkedItems
  ) {
  }

  public record MessageResponse(String message) {
  }
}
