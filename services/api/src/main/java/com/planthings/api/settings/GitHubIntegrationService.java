package com.planthings.api.settings;

import com.planthings.api.auth.OAuthProperties;
import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.ApiException;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.common.url.ExpoGoReturnUrlResolver;
import com.planthings.api.github.BoardCardGitHubLinkRepository;
import com.planthings.api.github.GitHubApiClient;
import com.planthings.api.github.GitHubOAuthClient;
import com.planthings.api.github.PlanGitHubRepoRepository;
import java.net.URI;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class GitHubIntegrationService {

  private static final String CLIENT_WEB = "web";
  private static final String CLIENT_MOBILE = "mobile";
  private static final String CLIENT_MOBILE_WEB = "mobile-web";

  private final AuthenticatedUserService authenticatedUserService;
  private final UserRepository userRepository;
  private final GitHubConnectionRepository connectionRepository;
  private final GitHubOAuthStateRepository stateRepository;
  private final OAuthProperties oauthProperties;
  private final GitHubIntegrationProperties githubProperties;
  private final GitHubOAuthClient githubOAuthClient;
  private final GitHubApiClient githubApiClient;
  private final IntegrationTokenCipher tokenCipher;
  private final BrazilDateTimeMapper dateTimeMapper;
  private final Clock clock;
  private final PlanGitHubRepoRepository planGitHubRepoRepository;
  private final BoardCardGitHubLinkRepository boardCardGitHubLinkRepository;
  private final SecureRandom secureRandom = new SecureRandom();

  public GitHubIntegrationService(
      AuthenticatedUserService authenticatedUserService,
      UserRepository userRepository,
      GitHubConnectionRepository connectionRepository,
      GitHubOAuthStateRepository stateRepository,
      OAuthProperties oauthProperties,
      GitHubIntegrationProperties githubProperties,
      GitHubOAuthClient githubOAuthClient,
      GitHubApiClient githubApiClient,
      IntegrationTokenCipher tokenCipher,
      BrazilDateTimeMapper dateTimeMapper,
      Clock clock,
      PlanGitHubRepoRepository planGitHubRepoRepository,
      BoardCardGitHubLinkRepository boardCardGitHubLinkRepository
  ) {
    this.authenticatedUserService = authenticatedUserService;
    this.userRepository = userRepository;
    this.connectionRepository = connectionRepository;
    this.stateRepository = stateRepository;
    this.oauthProperties = oauthProperties;
    this.githubProperties = githubProperties;
    this.githubOAuthClient = githubOAuthClient;
    this.githubApiClient = githubApiClient;
    this.tokenCipher = tokenCipher;
    this.dateTimeMapper = dateTimeMapper;
    this.clock = clock;
    this.planGitHubRepoRepository = planGitHubRepoRepository;
    this.boardCardGitHubLinkRepository = boardCardGitHubLinkRepository;
  }

  @Transactional
  public AuthorizationStartResponse startAuthorization(String client, String redirectTo) {
    UserEntity user = authenticatedUserService.requireUser();
    requireGitHubConfig();

    String state = randomToken();
    GitHubOAuthStateEntity stateEntity = new GitHubOAuthStateEntity();
    stateEntity.setUserId(user.getId());
    stateEntity.setStateToken(state);
    stateEntity.setClient(normalizeClient(client));
    stateEntity.setRedirectPath(sanitizeRedirectPath(redirectTo));
    stateEntity.setExpiresAt(OffsetDateTime.now(clock).plusMinutes(githubProperties.getStateMinutes()));
    stateRepository.save(stateEntity);

    String authorizationUrl = UriComponentsBuilder.fromUri(githubProperties.getAuthorizationUri())
        .queryParam("client_id", githubProperties.getClientId())
        .queryParam("redirect_uri", githubProperties.getRedirectUri().toString())
        .queryParam("scope", String.join(" ", githubProperties.getScopes()))
        .queryParam("state", state)
        .build()
        .encode()
        .toUriString();

    return new AuthorizationStartResponse(authorizationUrl);
  }

  @Transactional
  public URI completeProviderCallback(String state, String code, String error) {
    String callbackClient = CLIENT_WEB;
    String callbackRedirectPath = null;

    try {
      GitHubOAuthStateEntity stateEntity = consumeState(state);
      callbackClient = stateEntity.getClient();
      callbackRedirectPath = stateEntity.getRedirectPath();

      if (StringUtils.hasText(error)) {
        rememberLastError(stateEntity.getUserId(), "GITHUB_PROVIDER_ERROR");
        return buildFrontendReturn("error", "GITHUB_PROVIDER_ERROR", callbackClient, callbackRedirectPath);
      }

      if (!StringUtils.hasText(code)) {
        throw new BadRequestException("GITHUB_OAUTH_CODE_AUSENTE", "O GitHub nao retornou codigo de autorizacao.");
      }

      GitHubOAuthClient.GitHubTokenResponse tokenResponse = githubOAuthClient.exchangeCode(
          code,
          githubProperties.getRedirectUri().toString()
      );
      GitHubApiClient.GitHubUser githubUser = githubApiClient.getAuthenticatedUser(tokenResponse.accessToken());
      UserEntity user = userRepository.findById(stateEntity.getUserId())
          .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos o usuario vinculado a esta conexao GitHub."));

      saveConnection(user, githubUser, tokenResponse);
      return buildFrontendReturn("connected", null, callbackClient, callbackRedirectPath);
    } catch (ApiException exception) {
      return buildFrontendReturn("error", exception.getCode(), callbackClient, callbackRedirectPath);
    } catch (RuntimeException exception) {
      return buildFrontendReturn("error", "GITHUB_TOKEN_EXCHANGE_FALHOU", callbackClient, callbackRedirectPath);
    }
  }

  @Transactional(readOnly = true)
  public GitHubIntegrationSettings getIntegrationForUser(UUID userId) {
    return toGitHubSettings(connectionRepository.findByUserId(userId).orElse(null));
  }

  @Transactional
  public GitHubIntegrationSettings disconnectGitHub() {
    UserEntity user = authenticatedUserService.requireUser();
    OffsetDateTime now = OffsetDateTime.now(clock);
    connectionRepository.findByUserId(user.getId()).ifPresent(connection -> {
      connection.setRevokedAt(now);
      connection.setLastCheckedAt(now);
      connectionRepository.save(connection);
      markLinksUnavailableForUser(user.getId());
    });
    return getIntegrationForUser(user.getId());
  }

  @Transactional
  public GitHubDisconnectResponse disconnectGitHubWrapped() {
    return new GitHubDisconnectResponse(disconnectGitHub());
  }

  @Transactional(readOnly = true)
  public List<GitHubRepoOption> searchAccessibleRepositories(String query) {
    UserEntity user = authenticatedUserService.requireUser();
    String accessToken = tokenCipher.decrypt(requireActiveConnection(user.getId()).getEncryptedAccessToken());
    return githubApiClient.searchAccessibleRepositories(accessToken, query, 1, 30).stream()
        .map(repo -> new GitHubRepoOption(
            String.valueOf(repo.id()),
            repo.fullName(),
            repo.description(),
            repo.isPrivate(),
            repo.ownerAvatarUrl(),
            repo.defaultBranch()
        ))
        .toList();
  }

  private GitHubConnectionEntity requireActiveConnection(UUID userId) {
    GitHubConnectionEntity connection = connectionRepository.findByUserId(userId)
        .orElseThrow(() -> new BadRequestException("GITHUB_NAO_CONECTADO", "Conecte sua conta GitHub em Configuracoes."));
    if (connection.getRevokedAt() != null) {
      throw new BadRequestException("GITHUB_NAO_CONECTADO", "Conecte sua conta GitHub em Configuracoes.");
    }
    return connection;
  }

  private void saveConnection(
      UserEntity user,
      GitHubApiClient.GitHubUser githubUser,
      GitHubOAuthClient.GitHubTokenResponse tokenResponse
  ) {
    OffsetDateTime now = OffsetDateTime.now(clock);
    GitHubConnectionEntity connection = connectionRepository.findByUserId(user.getId()).orElseGet(GitHubConnectionEntity::new);
    connection.setUserId(user.getId());
    connection.setGithubUserId(githubUser.id());
    connection.setGithubLogin(githubUser.login());
    connection.setGithubAvatarUrl(githubUser.avatarUrl());
    connection.setScopes(String.join(" ", normalizeScopes(tokenResponse.scope())));
    connection.setEncryptedAccessToken(tokenCipher.encrypt(tokenResponse.accessToken()));
    connection.setConnectedAt(now);
    connection.setRevokedAt(null);
    connection.setLastError(null);
    connection.setLastCheckedAt(now);
    connectionRepository.save(connection);
    markLinksAvailableForUser(user.getId());
  }

  private void markLinksUnavailableForUser(UUID userId) {
    planGitHubRepoRepository.findByConnectionUserIdAndRemovedAtIsNull(userId).forEach(planRepo -> {
      boardCardGitHubLinkRepository.findByPlanGithubRepoId(planRepo.getId()).forEach(link -> {
        link.setUnavailable(true);
        boardCardGitHubLinkRepository.save(link);
      });
    });
  }

  private void markLinksAvailableForUser(UUID userId) {
    planGitHubRepoRepository.findByConnectionUserIdAndRemovedAtIsNull(userId).forEach(planRepo -> {
      boardCardGitHubLinkRepository.findByPlanGithubRepoId(planRepo.getId()).forEach(link -> {
        link.setUnavailable(false);
        boardCardGitHubLinkRepository.save(link);
      });
    });
  }

  private GitHubOAuthStateEntity consumeState(String state) {
    if (!StringUtils.hasText(state)) {
      throw new BadRequestException("GITHUB_OAUTH_STATE_INVALIDO", "A validacao de seguranca da conexao GitHub e invalida.");
    }

    GitHubOAuthStateEntity stateEntity = stateRepository.findByStateTokenForUpdate(state)
        .orElseThrow(() -> new BadRequestException("GITHUB_OAUTH_STATE_INVALIDO", "A validacao de seguranca da conexao GitHub e invalida."));

    OffsetDateTime now = OffsetDateTime.now(clock);
    if (stateEntity.getUsedAt() != null || stateEntity.getExpiresAt().isBefore(now)) {
      throw new BadRequestException("GITHUB_OAUTH_STATE_EXPIRADO", "A validacao de seguranca da conexao GitHub expirou.");
    }

    stateEntity.setUsedAt(now);
    stateRepository.save(stateEntity);
    return stateEntity;
  }

  private void rememberLastError(UUID userId, String errorCode) {
    GitHubConnectionEntity connection = connectionRepository.findByUserId(userId).orElse(null);
    if (connection == null) {
      return;
    }
    connection.setLastError(errorCode);
    connection.setLastCheckedAt(OffsetDateTime.now(clock));
    connectionRepository.save(connection);
  }

  private List<String> normalizeScopes(String grantedScope) {
    if (!StringUtils.hasText(grantedScope)) {
      return githubProperties.getScopes();
    }
    return Arrays.stream(grantedScope.trim().split("[,\\s]+"))
        .filter(StringUtils::hasText)
        .toList();
  }

  private GitHubIntegrationSettings toGitHubSettings(GitHubConnectionEntity connection) {
    boolean connected = connection != null && connection.getRevokedAt() == null;
    if (!connected) {
      return new GitHubIntegrationSettings(
          false,
          null,
          null,
          List.of(),
          null,
          connection == null ? null : connection.getLastError()
      );
    }

    return new GitHubIntegrationSettings(
        true,
        connection.getGithubLogin(),
        connection.getGithubAvatarUrl(),
        normalizeScopes(connection.getScopes()),
        dateTimeMapper.toDateTime(connection.getConnectedAt()),
        connection.getLastError()
    );
  }

  private void requireGitHubConfig() {
    if (!StringUtils.hasText(githubProperties.getClientId())
        || !StringUtils.hasText(githubProperties.getClientSecret())
        || githubProperties.getRedirectUri() == null) {
      throw new BadRequestException("GITHUB_OAUTH_INDISPONIVEL", "A conexao GitHub ainda nao esta configurada.");
    }
    if (!githubProperties.getScopes().contains(GitHubIntegrationProperties.REPO_SCOPE)) {
      throw new BadRequestException("GITHUB_SCOPE_AUSENTE", "A permissao repo nao foi configurada.");
    }
  }

  private URI buildFrontendReturn(String githubStatus, String errorCode, String client, String redirectPath) {
    String normalizedClient = normalizeClient(client);
    URI returnUrl = switch (normalizedClient) {
      case CLIENT_MOBILE -> ExpoGoReturnUrlResolver.forSettingsReturn(githubProperties.getMobileReturnUrl());
      case CLIENT_MOBILE_WEB -> githubProperties.getMobileWebReturnUrl();
      default -> githubProperties.getWebReturnUrl();
    };
    UriComponentsBuilder builder = UriComponentsBuilder.fromUri(returnUrl)
        .queryParam("section", "integrations")
        .queryParam("github", githubStatus);

    if (StringUtils.hasText(redirectPath)) {
      builder.queryParam("background", redirectPath);
    }
    if (StringUtils.hasText(errorCode)) {
      builder.queryParam("error", errorCode);
    }

    return builder.build().encode().toUri();
  }

  private String randomToken() {
    byte[] bytes = new byte[32];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String normalizeClient(String client) {
    String normalized = client == null ? "" : client.trim().toLowerCase(Locale.ROOT);
    if (CLIENT_MOBILE.equals(normalized)) {
      return CLIENT_MOBILE;
    }
    if (CLIENT_MOBILE_WEB.equals(normalized)) {
      return CLIENT_MOBILE_WEB;
    }
    return CLIENT_WEB;
  }

  private String sanitizeRedirectPath(String redirectTo) {
    if (!StringUtils.hasText(redirectTo)) {
      return null;
    }

    try {
      URI uri = URI.create(redirectTo.trim());
      String path = uri.getPath();
      if (uri.isAbsolute() || !StringUtils.hasText(path) || !path.startsWith("/") || redirectTo.startsWith("//")) {
        return null;
      }

      boolean allowed = oauthProperties.getAllowedRedirectPaths().stream()
          .anyMatch(prefix -> "/".equals(prefix) ? "/".equals(path) : path.equals(prefix) || path.startsWith(prefix + "/"));
      if (!allowed) {
        return null;
      }

      StringBuilder sanitized = new StringBuilder(path);
      if (uri.getRawQuery() != null) {
        sanitized.append('?').append(uri.getRawQuery());
      }
      if (uri.getRawFragment() != null) {
        sanitized.append('#').append(uri.getRawFragment());
      }
      return sanitized.toString();
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }

  public record AuthorizationStartResponse(String authorizationUrl) {
  }

  public record GitHubIntegrationSettings(
      boolean connected,
      String login,
      String avatarUrl,
      List<String> scopes,
      ApiDateTimeDto connectedAt,
      String lastError
  ) {
  }

  public record GitHubDisconnectResponse(GitHubIntegrationSettings github) {
  }

  public record GitHubRepoOption(
      String id,
      String fullName,
      String description,
      boolean isPrivate,
      String ownerAvatarUrl,
      String defaultBranch
  ) {
  }
}
