package com.planthings.api.auth;

import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ApiException;
import java.net.URI;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class OAuthLoginService {

  private static final Set<String> SUPPORTED_PROVIDERS = Set.of("google", "microsoft");
  private static final Logger logger = LoggerFactory.getLogger(OAuthLoginService.class);

  private final OAuthProperties properties;
  private final OAuthLoginStateRepository stateRepository;
  private final OAuthLoginCodeRepository codeRepository;
  private final OidcProviderClient providerClient;
  private final AuthService authService;
  private final Clock clock;
  private final TransactionTemplate transactionTemplate;
  private final SecureRandom secureRandom = new SecureRandom();

  public OAuthLoginService(
      OAuthProperties properties,
      OAuthLoginStateRepository stateRepository,
      OAuthLoginCodeRepository codeRepository,
      OidcProviderClient providerClient,
      AuthService authService,
      Clock clock,
      TransactionTemplate transactionTemplate
  ) {
    this.properties = properties;
    this.stateRepository = stateRepository;
    this.codeRepository = codeRepository;
    this.providerClient = providerClient;
    this.authService = authService;
    this.clock = clock;
    this.transactionTemplate = transactionTemplate;
  }

  public AuthorizationStartResponse start(String provider, String redirectTo, String client) {
    String normalizedProvider = normalizeProvider(provider);
    String normalizedClient = normalizeClient(client);
    OAuthProperties.Provider providerConfig = requireProviderConfig(normalizedProvider);

    String state = randomToken();
    String nonce = randomToken();
    OAuthLoginStateEntity stateEntity = new OAuthLoginStateEntity();
    stateEntity.setProvider(normalizedProvider);
    stateEntity.setStateToken(state);
    stateEntity.setNonce(nonce);
    stateEntity.setRedirectPath(sanitizeRedirectPath(redirectTo));
    stateEntity.setClient(normalizedClient);
    stateEntity.setExpiresAt(OffsetDateTime.now(clock).plusMinutes(properties.getStateMinutes()));
    stateRepository.save(stateEntity);

    String authorizationUrl = UriComponentsBuilder.fromUriString(providerConfig.getAuthorizationUri())
        .queryParam("client_id", providerConfig.getClientId())
        .queryParam("redirect_uri", providerConfig.getRedirectUri())
        .queryParam("response_type", "code")
        .queryParam("scope", String.join(" ", providerConfig.getScopes()))
        .queryParam("state", state)
        .queryParam("nonce", nonce)
        .build()
        .encode()
        .toUriString();

    return new AuthorizationStartResponse(authorizationUrl);
  }

  public URI completeProviderCallback(String provider, String state, String code, String error) {
    String normalizedProvider = normalizeProvider(provider);
    String callbackClient = "web";

    try {
      if (StringUtils.hasText(error)) {
        OAuthLoginStateEntity stateEntity = consumeStateIfPresent(normalizedProvider, state);
        if (stateEntity != null) {
          callbackClient = stateEntity.getClient();
        }
        return buildFrontendCallback(null, null, "OAUTH_PROVIDER_ERROR", callbackClient);
      }

      if (!StringUtils.hasText(code)) {
        OAuthLoginStateEntity stateEntity = consumeStateIfPresent(normalizedProvider, state);
        if (stateEntity != null) {
          callbackClient = stateEntity.getClient();
        }
        return buildFrontendCallback(null, null, "OAUTH_CODE_AUSENTE", callbackClient);
      }

      OAuthProperties.Provider providerConfig = requireProviderConfig(normalizedProvider);
      OAuthLoginStateEntity stateEntity = Objects.requireNonNull(transactionTemplate.execute(
          status -> consumeState(normalizedProvider, state)
      ));
      callbackClient = stateEntity.getClient();
      OAuthIdentity identity = providerClient.exchangeCode(normalizedProvider, providerConfig, code, stateEntity.getNonce());

      return Objects.requireNonNull(transactionTemplate.execute(
          status -> createCompletionCode(identity, stateEntity)
      ));
    } catch (ApiException exception) {
      return buildFrontendCallback(null, null, exception.getCode(), callbackClient);
    } catch (RuntimeException exception) {
      logger.warn("Unexpected OAuth callback failure for provider={}", normalizedProvider, exception);
      return buildFrontendCallback(null, null, "OAUTH_CALLBACK_FALHOU", callbackClient);
    }
  }

  private URI createCompletionCode(OAuthIdentity identity, OAuthLoginStateEntity stateEntity) {
    AuthService.SessionResponse session = authService.loginWithExternalIdentity(identity);

    OAuthLoginCodeEntity codeEntity = new OAuthLoginCodeEntity();
    codeEntity.setCompletionCode(randomToken());
    codeEntity.setUserId(session.user().id());
    codeEntity.setRedirectPath(stateEntity.getRedirectPath());
    codeEntity.setExpiresAt(OffsetDateTime.now(clock).plusMinutes(properties.getCompletionCodeMinutes()));
    codeRepository.save(codeEntity);

    return buildFrontendCallback(codeEntity.getCompletionCode(), codeEntity.getRedirectPath(), null, stateEntity.getClient());
  }

  @Transactional
  public AuthService.SessionResponse exchangeCompletionCode(String completionCode) {
    OAuthLoginCodeEntity codeEntity = codeRepository.findByCompletionCodeForUpdate(completionCode)
        .orElseThrow(() -> new BadRequestException("OAUTH_COMPLETION_CODE_INVALIDO", "O codigo de conclusao do login e invalido."));

    OffsetDateTime now = OffsetDateTime.now(clock);
    if (codeEntity.getUsedAt() != null || codeEntity.getExpiresAt().isBefore(now)) {
      throw new BadRequestException("OAUTH_COMPLETION_CODE_EXPIRADO", "O codigo de conclusao do login expirou.");
    }

    codeEntity.setUsedAt(now);
    codeRepository.save(codeEntity);

    return authService.sessionForUserId(codeEntity.getUserId());
  }

  private OAuthLoginStateEntity consumeState(String provider, String state) {
    if (!StringUtils.hasText(state)) {
      throw new BadRequestException("ESTADO_OAUTH_INVALIDO", "A validacao de seguranca do login e invalida.");
    }

    OAuthLoginStateEntity stateEntity = stateRepository.findByStateTokenForUpdate(state)
        .orElseThrow(() -> new BadRequestException("ESTADO_OAUTH_INVALIDO", "A validacao de seguranca do login e invalida."));

    OffsetDateTime now = OffsetDateTime.now(clock);
    if (!provider.equals(stateEntity.getProvider()) || stateEntity.getUsedAt() != null || stateEntity.getExpiresAt().isBefore(now)) {
      throw new BadRequestException("ESTADO_OAUTH_EXPIRADO", "A validacao de seguranca do login expirou.");
    }

    stateEntity.setUsedAt(now);
    stateRepository.save(stateEntity);
    return stateEntity;
  }

  private OAuthLoginStateEntity consumeStateIfPresent(String provider, String state) {
    if (!StringUtils.hasText(state)) {
      return null;
    }
    return transactionTemplate.execute(status -> consumeState(provider, state));
  }

  private OAuthProperties.Provider requireProviderConfig(String provider) {
    if (!SUPPORTED_PROVIDERS.contains(provider)) {
      throw new BadRequestException("PROVEDOR_OAUTH_INVALIDO", "Provedor OAuth nao suportado.");
    }

    OAuthProperties.Provider providerConfig = properties.getProviders().get(provider);
    if (providerConfig == null
        || !StringUtils.hasText(providerConfig.getClientId())
        || !StringUtils.hasText(providerConfig.getClientSecret())
        || !StringUtils.hasText(providerConfig.getAuthorizationUri())
        || !StringUtils.hasText(providerConfig.getTokenUri())
        || !StringUtils.hasText(providerConfig.getRedirectUri())
        || !StringUtils.hasText(providerConfig.getJwkSetUri())) {
      throw new BadRequestException("PROVEDOR_OAUTH_INDISPONIVEL", "Este provedor OAuth ainda nao esta configurado.");
    }

    return providerConfig;
  }

  private URI buildFrontendCallback(String completionCode, String redirectPath, String errorCode, String client) {
    URI callbackUrl = "mobile".equals(normalizeClient(client))
        ? properties.getMobileCallbackUrl()
        : properties.getWebCallbackUrl();
    UriComponentsBuilder builder = UriComponentsBuilder.fromUri(callbackUrl);

    if (StringUtils.hasText(completionCode)) {
      builder.queryParam("code", completionCode);
    }
    if (StringUtils.hasText(redirectPath)) {
      builder.queryParam("redirectTo", redirectPath);
    }
    if (StringUtils.hasText(errorCode)) {
      builder.queryParam("error", errorCode);
    }

    return builder.build().encode().toUri();
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

      boolean allowed = properties.getAllowedRedirectPaths().stream()
          .anyMatch(prefix -> "/".equals(prefix) ? "/".equals(path) : path.equals(prefix) || path.startsWith(prefix + "/"));
      if (!allowed) {
        return null;
      }

      return uri.getRawQuery() == null ? path : path + "?" + uri.getRawQuery();
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }

  private String randomToken() {
    byte[] bytes = new byte[32];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String normalizeProvider(String provider) {
    return provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
  }

  private String normalizeClient(String client) {
    String normalized = client == null ? "" : client.trim().toLowerCase(Locale.ROOT);
    return "mobile".equals(normalized) ? "mobile" : "web";
  }

  public record AuthorizationStartResponse(String authorizationUrl) {
  }
}
