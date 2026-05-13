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
public class GmailIntegrationService {

  private static final String GOOGLE_PROVIDER = "google";
  private static final String CLIENT_WEB = "web";
  private static final String CLIENT_MOBILE = "mobile";
  private static final String CLIENT_MOBILE_WEB = "mobile-web";

  private final AuthenticatedUserService authenticatedUserService;
  private final UserRepository userRepository;
  private final GmailConnectionRepository connectionRepository;
  private final GmailOAuthStateRepository stateRepository;
  private final OAuthProperties oauthProperties;
  private final GmailIntegrationProperties gmailProperties;
  private final GmailOAuthClient gmailOAuthClient;
  private final IntegrationTokenCipher tokenCipher;
  private final BrazilDateTimeMapper dateTimeMapper;
  private final Clock clock;
  private final SecureRandom secureRandom = new SecureRandom();

  public GmailIntegrationService(
      AuthenticatedUserService authenticatedUserService,
      UserRepository userRepository,
      GmailConnectionRepository connectionRepository,
      GmailOAuthStateRepository stateRepository,
      OAuthProperties oauthProperties,
      GmailIntegrationProperties gmailProperties,
      GmailOAuthClient gmailOAuthClient,
      IntegrationTokenCipher tokenCipher,
      BrazilDateTimeMapper dateTimeMapper,
      Clock clock
  ) {
    this.authenticatedUserService = authenticatedUserService;
    this.userRepository = userRepository;
    this.connectionRepository = connectionRepository;
    this.stateRepository = stateRepository;
    this.oauthProperties = oauthProperties;
    this.gmailProperties = gmailProperties;
    this.gmailOAuthClient = gmailOAuthClient;
    this.tokenCipher = tokenCipher;
    this.dateTimeMapper = dateTimeMapper;
    this.clock = clock;
  }

  @Transactional
  public AuthorizationStartResponse startAuthorization(String client, String redirectTo) {
    UserEntity user = authenticatedUserService.requireUser();
    OAuthProperties.Provider providerConfig = requireGoogleProviderConfig();
    String normalizedClient = normalizeClient(client);

    String state = randomToken();
    String nonce = randomToken();
    GmailOAuthStateEntity stateEntity = new GmailOAuthStateEntity();
    stateEntity.setUserId(user.getId());
    stateEntity.setStateToken(state);
    stateEntity.setNonce(nonce);
    stateEntity.setClient(normalizedClient);
    stateEntity.setRedirectPath(sanitizeRedirectPath(redirectTo));
    stateEntity.setExpiresAt(OffsetDateTime.now(clock).plusMinutes(gmailProperties.getStateMinutes()));
    stateRepository.save(stateEntity);

    String authorizationUrl = UriComponentsBuilder.fromUriString(providerConfig.getAuthorizationUri())
        .queryParam("client_id", providerConfig.getClientId())
        .queryParam("redirect_uri", gmailProperties.getRedirectUri().toString())
        .queryParam("response_type", "code")
        .queryParam("scope", String.join(" ", gmailProperties.getScopes()))
        .queryParam("state", state)
        .queryParam("nonce", nonce)
        .queryParam("access_type", "offline")
        .queryParam("include_granted_scopes", "true")
        .queryParam("prompt", "consent")
        .build()
        .encode()
        .toUriString();

    return new AuthorizationStartResponse(authorizationUrl);
  }

  @Transactional
  public URI completeProviderCallback(String state, String code, String error) {
    String callbackClient = "web";
    String callbackRedirectPath = null;

    try {
      GmailOAuthStateEntity stateEntity = consumeState(state);
      callbackClient = stateEntity.getClient();
      callbackRedirectPath = stateEntity.getRedirectPath();

      if (StringUtils.hasText(error)) {
        rememberLastError(stateEntity.getUserId(), "GMAIL_PROVIDER_ERROR");
        return buildFrontendReturn("error", "GMAIL_PROVIDER_ERROR", callbackClient, callbackRedirectPath);
      }

      if (!StringUtils.hasText(code)) {
        throw new BadRequestException("GMAIL_OAUTH_CODE_AUSENTE", "O Google nao retornou codigo de autorizacao.");
      }

      OAuthProperties.Provider providerConfig = requireGoogleProviderConfig();
      GmailOAuthClient.GmailTokenResponse tokenResponse = gmailOAuthClient.exchangeCode(
          providerConfig,
          code,
          gmailProperties.getRedirectUri().toString(),
          stateEntity.getNonce()
      );
      UserEntity user = userRepository.findById(stateEntity.getUserId())
          .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos o usuario vinculado a esta conexao Gmail."));

      validateGmailIdentity(user, tokenResponse);
      saveConnection(user, tokenResponse);
      return buildFrontendReturn("connected", null, callbackClient, callbackRedirectPath);
    } catch (ApiException exception) {
      return buildFrontendReturn("error", exception.getCode(), callbackClient, callbackRedirectPath);
    } catch (RuntimeException exception) {
      return buildFrontendReturn("error", "GMAIL_TOKEN_EXCHANGE_FALHOU", callbackClient, callbackRedirectPath);
    }
  }

  @Transactional(readOnly = true)
  public IntegrationsSettings getIntegrationsForUser(UUID userId) {
    return new IntegrationsSettings(toGmailSettings(connectionRepository.findByUserId(userId).orElse(null)));
  }

  @Transactional
  public IntegrationsSettings disconnectGmail() {
    UserEntity user = authenticatedUserService.requireUser();
    OffsetDateTime now = OffsetDateTime.now(clock);
    connectionRepository.findByUserId(user.getId()).ifPresent(connection -> {
      connection.setRevokedAt(now);
      connection.setLastCheckedAt(now);
      connectionRepository.save(connection);
    });
    return getIntegrationsForUser(user.getId());
  }

  private GmailOAuthStateEntity consumeState(String state) {
    if (!StringUtils.hasText(state)) {
      throw new BadRequestException("GMAIL_OAUTH_STATE_INVALIDO", "A validacao de seguranca da conexao Gmail e invalida.");
    }

    GmailOAuthStateEntity stateEntity = stateRepository.findByStateTokenForUpdate(state)
        .orElseThrow(() -> new BadRequestException("GMAIL_OAUTH_STATE_INVALIDO", "A validacao de seguranca da conexao Gmail e invalida."));

    OffsetDateTime now = OffsetDateTime.now(clock);
    if (stateEntity.getUsedAt() != null || stateEntity.getExpiresAt().isBefore(now)) {
      throw new BadRequestException("GMAIL_OAUTH_STATE_EXPIRADO", "A validacao de seguranca da conexao Gmail expirou.");
    }

    stateEntity.setUsedAt(now);
    stateRepository.save(stateEntity);
    return stateEntity;
  }

  private void validateGmailIdentity(UserEntity user, GmailOAuthClient.GmailTokenResponse tokenResponse) {
    if (!StringUtils.hasText(tokenResponse.email()) || !tokenResponse.emailVerified()) {
      throw new BadRequestException("GMAIL_EMAIL_NAO_VERIFICADO", "O Google nao confirmou o e-mail da conta Gmail.");
    }

    if (!user.getEmail().equalsIgnoreCase(tokenResponse.email())) {
      rememberLastError(user.getId(), "GMAIL_EMAIL_DIVERGENTE");
      throw new BadRequestException("GMAIL_EMAIL_DIVERGENTE", "Conecte o Gmail usando o mesmo e-mail da sua conta Plan Things.");
    }

    if (!StringUtils.hasText(tokenResponse.refreshToken())) {
      rememberLastError(user.getId(), "GMAIL_REFRESH_TOKEN_AUSENTE");
      throw new BadRequestException("GMAIL_REFRESH_TOKEN_AUSENTE", "O Google nao retornou permissao offline para manter a conexao Gmail ativa.");
    }
  }

  private void saveConnection(UserEntity user, GmailOAuthClient.GmailTokenResponse tokenResponse) {
    OffsetDateTime now = OffsetDateTime.now(clock);
    GmailConnectionEntity connection = connectionRepository.findByUserId(user.getId()).orElseGet(GmailConnectionEntity::new);
    connection.setUserId(user.getId());
    connection.setEmail(tokenResponse.email().trim().toLowerCase(Locale.ROOT));
    connection.setScopes(String.join(" ", normalizeScopes(tokenResponse.scope())));
    connection.setEncryptedRefreshToken(tokenCipher.encrypt(tokenResponse.refreshToken()));
    connection.setConnectedAt(now);
    connection.setRevokedAt(null);
    connection.setLastError(null);
    connection.setLastCheckedAt(now);
    connectionRepository.save(connection);
  }

  private void rememberLastError(UUID userId, String errorCode) {
    GmailConnectionEntity connection = connectionRepository.findByUserId(userId).orElse(null);
    if (connection == null) {
      return;
    }
    connection.setLastError(errorCode);
    connection.setLastCheckedAt(OffsetDateTime.now(clock));
    connectionRepository.save(connection);
  }

  private List<String> normalizeScopes(String grantedScope) {
    if (!StringUtils.hasText(grantedScope)) {
      return gmailProperties.getScopes();
    }
    return Arrays.stream(grantedScope.trim().split("\\s+"))
        .filter(StringUtils::hasText)
        .toList();
  }

  private GmailIntegrationSettings toGmailSettings(GmailConnectionEntity connection) {
    boolean connected = connection != null && connection.getRevokedAt() == null;
    if (!connected) {
      return new GmailIntegrationSettings(false, null, List.of(), null, connection == null ? null : connection.getLastError());
    }

    return new GmailIntegrationSettings(
        true,
        connection.getEmail(),
        normalizeScopes(connection.getScopes()),
        dateTimeMapper.toDateTime(connection.getConnectedAt()),
        connection.getLastError()
    );
  }

  private OAuthProperties.Provider requireGoogleProviderConfig() {
    OAuthProperties.Provider providerConfig = oauthProperties.getProviders().get(GOOGLE_PROVIDER);
    if (providerConfig == null
        || !StringUtils.hasText(providerConfig.getClientId())
        || !StringUtils.hasText(providerConfig.getClientSecret())
        || !StringUtils.hasText(providerConfig.getAuthorizationUri())
        || !StringUtils.hasText(providerConfig.getTokenUri())
        || !StringUtils.hasText(providerConfig.getJwkSetUri())) {
      throw new BadRequestException("PROVEDOR_OAUTH_INDISPONIVEL", "A conexao Google ainda nao esta configurada.");
    }
    if (!gmailProperties.getScopes().contains(GmailIntegrationProperties.GMAIL_SEND_SCOPE)) {
      throw new BadRequestException("GMAIL_SCOPE_AUSENTE", "A permissao de envio Gmail nao foi configurada.");
    }
    return providerConfig;
  }

  private URI buildFrontendReturn(String gmailStatus, String errorCode, String client, String redirectPath) {
    String normalizedClient = normalizeClient(client);
    URI returnUrl = switch (normalizedClient) {
      case CLIENT_MOBILE -> ExpoGoReturnUrlResolver.forSettingsReturn(gmailProperties.getMobileReturnUrl());
      case CLIENT_MOBILE_WEB -> gmailProperties.getMobileWebReturnUrl();
      default -> gmailProperties.getWebReturnUrl();
    };
    UriComponentsBuilder builder = UriComponentsBuilder.fromUri(returnUrl)
        .queryParam("section", "integrations")
        .queryParam("gmail", gmailStatus);

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

  public record IntegrationsSettings(GmailIntegrationSettings gmail) {
  }

  public record GmailIntegrationSettings(
      boolean connected,
      String email,
      List<String> scopes,
      ApiDateTimeDto connectedAt,
      String lastError
  ) {
  }
}
