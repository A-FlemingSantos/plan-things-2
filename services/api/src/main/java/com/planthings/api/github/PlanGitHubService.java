package com.planthings.api.github;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanMemberRole;
import com.planthings.api.settings.GitHubIntegrationService;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PlanGitHubService {

  private final PlanAccessService planAccessService;
  private final AuthenticatedUserService authenticatedUserService;
  private final UserRepository userRepository;
  private final PlanGitHubRepoRepository planGitHubRepoRepository;
  private final BoardCardGitHubLinkRepository boardCardGitHubLinkRepository;
  private final GitHubAccessTokenService accessTokenService;
  private final GitHubApiClient githubApiClient;
  private final GitHubIntegrationService githubIntegrationService;
  private final GitHubLinkMapper linkMapper;
  private final BrazilDateTimeMapper dateTimeMapper;
  private final Clock clock;

  public PlanGitHubService(
      PlanAccessService planAccessService,
      AuthenticatedUserService authenticatedUserService,
      UserRepository userRepository,
      PlanGitHubRepoRepository planGitHubRepoRepository,
      BoardCardGitHubLinkRepository boardCardGitHubLinkRepository,
      GitHubAccessTokenService accessTokenService,
      GitHubApiClient githubApiClient,
      GitHubIntegrationService githubIntegrationService,
      GitHubLinkMapper linkMapper,
      BrazilDateTimeMapper dateTimeMapper,
      Clock clock
  ) {
    this.planAccessService = planAccessService;
    this.authenticatedUserService = authenticatedUserService;
    this.userRepository = userRepository;
    this.planGitHubRepoRepository = planGitHubRepoRepository;
    this.boardCardGitHubLinkRepository = boardCardGitHubLinkRepository;
    this.accessTokenService = accessTokenService;
    this.githubApiClient = githubApiClient;
    this.githubIntegrationService = githubIntegrationService;
    this.linkMapper = linkMapper;
    this.dateTimeMapper = dateTimeMapper;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public PlanGitHubStatus getStatus(UUID planId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);
    PlanMemberRole role = planAccessService.requireMemberRole(planId, currentUserId);
    boolean manager = PlanAccessService.isManager(role);
    boolean userConnected = accessTokenService.isConnected(currentUserId);

    List<ConnectedGitHubRepoView> repos = planGitHubRepoRepository.findByPlanIdAndRemovedAtIsNullOrderByConnectedAtAsc(planId).stream()
        .map(this::toConnectedRepoView)
        .toList();

    return new PlanGitHubStatus(manager, userConnected, repos);
  }

  @Transactional(readOnly = true)
  public List<GitHubIntegrationService.GitHubRepoOption> searchAccessibleRepositories(UUID planId, String query) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanManager(planId, currentUserId);
    return githubIntegrationService.searchAccessibleRepositories(query);
  }

  @Transactional
  public ConnectRepositoryResult connectRepository(UUID planId, ConnectRepositoryRequest request) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanManager(planId, currentUserId);

    String repoFullName = request.fullName();
    if (!StringUtils.hasText(repoFullName)) {
      throw new BadRequestException("GITHUB_REPO_OBRIGATORIO", "Informe o repositorio que deseja conectar.");
    }

    String accessToken = accessTokenService.requireActiveAccessToken(currentUserId);
    String[] parts = repoFullName.trim().split("/", 2);
    if (parts.length != 2) {
      throw new BadRequestException("GITHUB_REPO_INVALIDO", "Informe o repositorio no formato owner/repo.");
    }

    GitHubApiClient.GitHubRepository repository = githubApiClient.getRepository(accessToken, parts[0], parts[1]);

    PlanGitHubRepoEntity entity = planGitHubRepoRepository
        .findByPlanIdAndGithubRepoId(planId, repository.id())
        .orElseGet(PlanGitHubRepoEntity::new);

    OffsetDateTime now = OffsetDateTime.now(clock);
    entity.setPlanId(planId);
    entity.setConnectionUserId(currentUserId);
    entity.setGithubRepoId(repository.id());
    entity.setRepoFullName(repository.fullName());
    entity.setOwnerAvatarUrl(StringUtils.hasText(request.ownerAvatarUrl()) ? request.ownerAvatarUrl() : repository.ownerAvatarUrl());
    entity.setIsPrivate(request.isPrivate() == null ? repository.isPrivate() : request.isPrivate());
    entity.setDefaultBranch(StringUtils.hasText(request.defaultBranch()) ? request.defaultBranch() : repository.defaultBranch());
    entity.setConnectedAt(entity.getConnectedAt() == null ? now : entity.getConnectedAt());
    entity.setConnectedByUserId(currentUserId);
    entity.setRemovedAt(null);
    entity.setLastError(null);
    entity.setLastSyncedAt(now);
    PlanGitHubRepoEntity saved = planGitHubRepoRepository.save(entity);
    boardCardGitHubLinkRepository.findByPlanGithubRepoId(saved.getId()).forEach(link -> {
      link.setUnavailable(false);
      boardCardGitHubLinkRepository.save(link);
    });
    return new ConnectRepositoryResult(toConnectedRepoView(saved));
  }

  @Transactional(readOnly = true)
  public List<GitHubLinkMapper.GitHubLinkedItemView> searchObjects(
      UUID planId,
      String type,
      String repoFullName,
      String query
  ) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);

    if (!StringUtils.hasText(repoFullName)) {
      throw new BadRequestException("GITHUB_REPO_OBRIGATORIO", "Selecione um repositorio do plano para buscar.");
    }

    PlanGitHubRepoEntity planRepo = requireActivePlanRepo(planId, repoFullName);
    String accessToken = accessTokenService.requireActiveAccessToken(planRepo.getConnectionUserId());
    GitHubLinkType linkType = GitHubLinkType.fromApiValue(type);
    String[] parts = repoFullName.split("/", 2);
    String owner = parts[0];
    String repo = parts[1];
    String normalizedQuery = query == null ? "" : query.trim();

    List<GitHubApiClient.GitHubSearchItem> results = switch (linkType) {
      case ISSUE -> githubApiClient.searchIssuesAndPullRequests(
          accessToken,
          buildIssueSearchQuery(repoFullName, "is:issue", normalizedQuery),
          1,
          20
      );
      case PULL_REQUEST -> githubApiClient.searchIssuesAndPullRequests(
          accessToken,
          buildIssueSearchQuery(repoFullName, "is:pr", normalizedQuery),
          1,
          20
      ).stream().filter(item -> item.type() == GitHubLinkType.PULL_REQUEST).toList();
      case BRANCH -> githubApiClient.searchBranches(accessToken, owner, repo, normalizedQuery, 1, 30);
      case COMMIT -> githubApiClient.searchCommits(accessToken, owner, repo, normalizedQuery, 1, 20);
    };

    return results.stream().map(linkMapper::toSearchItemView).toList();
  }

  @Transactional
  public ConnectedGitHubRepoView removeRepository(UUID planId, UUID repoLinkId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanManager(planId, currentUserId);

    PlanGitHubRepoEntity entity = planGitHubRepoRepository.findByIdAndPlanIdAndRemovedAtIsNull(repoLinkId, planId)
        .orElseThrow(() -> new NotFoundException("GITHUB_REPO_NAO_ENCONTRADO", "Nao encontramos este repositorio no plano."));

    entity.setRemovedAt(OffsetDateTime.now(clock));
    planGitHubRepoRepository.save(entity);
    boardCardGitHubLinkRepository.findByPlanGithubRepoId(entity.getId()).forEach(link -> {
      link.setUnavailable(true);
      boardCardGitHubLinkRepository.save(link);
    });
    return toConnectedRepoView(entity);
  }

  @Transactional(readOnly = true)
  public PlanGitHubRepoEntity requireActivePlanRepo(UUID planId, String repoFullName) {
    return planGitHubRepoRepository.findByPlanIdAndRepoFullNameIgnoreCaseAndRemovedAtIsNull(planId, repoFullName)
        .orElseThrow(() -> new BadRequestException(
            "GITHUB_REPO_NAO_VINCULADO",
            "Este repositorio nao esta vinculado ao plano."
        ));
  }

  @Transactional(readOnly = true)
  public List<String> listConnectedRepoFullNames(UUID planId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);
    return planGitHubRepoRepository.findByPlanIdAndRemovedAtIsNullOrderByConnectedAtAsc(planId).stream()
        .map(PlanGitHubRepoEntity::getRepoFullName)
        .toList();
  }

  private ConnectedGitHubRepoView toConnectedRepoView(PlanGitHubRepoEntity entity) {
    UserEntity connectedBy = userRepository.findById(entity.getConnectedByUserId()).orElse(null);
    String status = entity.getRemovedAt() != null
        ? "removed"
        : (StringUtils.hasText(entity.getLastError()) ? "error" : "connected");
    return new ConnectedGitHubRepoView(
        entity.getId().toString(),
        entity.getRepoFullName(),
        entity.getOwnerAvatarUrl(),
        Boolean.TRUE.equals(entity.getIsPrivate()),
        status,
        entity.getLastError(),
        formatDateTime(entity.getConnectedAt()),
        connectedBy == null ? null : connectedBy.getFullName()
    );
  }

  private String formatDateTime(OffsetDateTime value) {
    ApiDateTimeDto dto = dateTimeMapper.toDateTime(value);
    return dto == null ? null : dto.iso();
  }

  private static String buildIssueSearchQuery(String repoFullName, String typeQualifier, String query) {
    StringBuilder builder = new StringBuilder("repo:").append(repoFullName).append(' ').append(typeQualifier);
    if (StringUtils.hasText(query)) {
      builder.append(' ').append(query.trim());
    }
    return builder.toString();
  }

  public record PlanGitHubStatus(
      boolean manager,
      boolean userGitHubConnected,
      List<ConnectedGitHubRepoView> connectedRepos
  ) {
  }

  public record ConnectedGitHubRepoView(
      String id,
      String fullName,
      String ownerAvatarUrl,
      boolean isPrivate,
      String connectionStatus,
      String errorMessage,
      String connectedAt,
      String connectedByName
  ) {
  }

  public record ConnectRepositoryRequest(
      String githubId,
      String fullName,
      String defaultBranch,
      @JsonProperty("private") Boolean isPrivate,
      String ownerAvatarUrl
  ) {
  }

  public record ConnectRepositoryResult(ConnectedGitHubRepoView repository) {
  }
}
