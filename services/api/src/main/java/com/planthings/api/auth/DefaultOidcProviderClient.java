package com.planthings.api.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.planthings.api.common.error.BadRequestException;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Component
public class DefaultOidcProviderClient implements OidcProviderClient {

  private final RestClient restClient;
  private final Map<String, JwtDecoder> decoders = new ConcurrentHashMap<>();

  public DefaultOidcProviderClient(RestClient.Builder restClientBuilder) {
    this.restClient = restClientBuilder.build();
  }

  @Override
  public OAuthIdentity exchangeCode(String provider, OAuthProperties.Provider config, String authorizationCode, String expectedNonce) {
    String normalizedProvider = normalizeProvider(provider);
    TokenResponse tokenResponse = exchangeAuthorizationCode(config, authorizationCode);

    if (!StringUtils.hasText(tokenResponse.idToken())) {
      throw new BadRequestException("OAUTH_ID_TOKEN_AUSENTE", "O provedor nao retornou um token de identidade.");
    }

    return identityFromIdToken(normalizedProvider, config, tokenResponse.idToken(), expectedNonce);
  }

  @Override
  public OAuthIdentity verifyIdToken(String provider, OAuthProperties.Provider config, String idToken) {
    return identityFromIdToken(normalizeProvider(provider), config, idToken, null);
  }

  private OAuthIdentity identityFromIdToken(
      String normalizedProvider,
      OAuthProperties.Provider config,
      String idToken,
      String expectedNonce
  ) {
    if (!StringUtils.hasText(idToken)) {
      throw new BadRequestException("OAUTH_ID_TOKEN_AUSENTE", "O provedor nao retornou um token de identidade.");
    }

    Jwt jwt = decodeIdToken(normalizedProvider, config, idToken);
    validateCommonClaims(normalizedProvider, config, jwt, expectedNonce);

    return switch (normalizedProvider) {
      case "google" -> googleIdentity(jwt);
      case "microsoft" -> microsoftIdentity(jwt);
      default -> throw new BadRequestException("PROVEDOR_OAUTH_INVALIDO", "Provedor OAuth nao suportado.");
    };
  }

  private TokenResponse exchangeAuthorizationCode(OAuthProperties.Provider config, String authorizationCode) {
    LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("grant_type", "authorization_code");
    form.add("code", authorizationCode);
    form.add("client_id", config.getClientId());
    form.add("client_secret", config.getClientSecret());
    form.add("redirect_uri", config.getRedirectUri());

    try {
      return restClient.post()
          .uri(config.getTokenUri())
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(form)
          .retrieve()
          .body(TokenResponse.class);
    } catch (RuntimeException exception) {
      throw new BadRequestException("OAUTH_TOKEN_EXCHANGE_FALHOU", "Nao foi possivel validar o login com o provedor externo.");
    }
  }

  private Jwt decodeIdToken(String provider, OAuthProperties.Provider config, String idToken) {
    JwtDecoder decoder = decoders.computeIfAbsent(provider, ignored -> NimbusJwtDecoder.withJwkSetUri(config.getJwkSetUri()).build());

    try {
      return decoder.decode(idToken);
    } catch (JwtException exception) {
      throw new BadRequestException("OAUTH_ID_TOKEN_INVALIDO", "O token de identidade do provedor externo e invalido.");
    }
  }

  private void validateCommonClaims(String provider, OAuthProperties.Provider config, Jwt jwt, String expectedNonce) {
    if (!jwt.getAudience().contains(config.getClientId())) {
      throw new BadRequestException("OAUTH_AUDIENCE_INVALIDA", "O token de identidade foi emitido para outro cliente.");
    }

    if (expectedNonce != null && !Objects.equals(jwt.getClaimAsString("nonce"), expectedNonce)) {
      throw new BadRequestException("OAUTH_NONCE_INVALIDO", "A validacao de seguranca do login expirou.");
    }

    String issuer = jwt.getIssuer() == null ? "" : jwt.getIssuer().toString();
    if ("google".equals(provider) && !("https://accounts.google.com".equals(issuer) || "accounts.google.com".equals(issuer))) {
      throw new BadRequestException("OAUTH_ISSUER_INVALIDO", "O emissor do login Google nao e confiavel.");
    }

    if ("microsoft".equals(provider) && !issuer.matches("^https://login\\.microsoftonline\\.com/[^/]+/v2\\.0$")) {
      throw new BadRequestException("OAUTH_ISSUER_INVALIDO", "O emissor do login Microsoft nao e confiavel.");
    }
  }

  private OAuthIdentity googleIdentity(Jwt jwt) {
    String email = jwt.getClaimAsString("email");
    boolean emailVerified = Boolean.TRUE.equals(jwt.getClaim("email_verified"));

    return new OAuthIdentity(
        "google",
        required(jwt.getSubject(), "OAUTH_SUBJECT_AUSENTE", "O login Google nao retornou identificador do usuario."),
        email,
        emailVerified,
        emailVerified,
        jwt.getClaimAsString("name"),
        jwt.getClaimAsString("picture")
    );
  }

  private OAuthIdentity microsoftIdentity(Jwt jwt) {
    String tenantId = jwt.getClaimAsString("tid");
    String objectId = jwt.getClaimAsString("oid");
    String subject = StringUtils.hasText(tenantId) && StringUtils.hasText(objectId)
        ? tenantId + ":" + objectId
        : jwt.getSubject();
    String email = firstText(jwt.getClaimAsString("email"), jwt.getClaimAsString("preferred_username"));
    boolean emailClaimVerified = Boolean.TRUE.equals(jwt.getClaim("email_verified"))
        || emailMatchesAny(jwt.getClaim("verified_primary_email"), email);
    boolean emailVerified = Boolean.TRUE.equals(jwt.getClaim("email_verified"))
        || Boolean.TRUE.equals(jwt.getClaim("xms_edov"))
        || emailMatchesAny(jwt.getClaim("verified_primary_email"), email);

    return new OAuthIdentity(
        "microsoft",
        required(subject, "OAUTH_SUBJECT_AUSENTE", "O login Microsoft nao retornou identificador do usuario."),
        email,
        emailVerified,
        emailClaimVerified,
        jwt.getClaimAsString("name"),
        null
    );
  }

  private String normalizeProvider(String provider) {
    return provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
  }

  private String required(String value, String code, String message) {
    if (!StringUtils.hasText(value)) {
      throw new BadRequestException(code, message);
    }
    return value;
  }

  private String firstText(String first, String second) {
    return StringUtils.hasText(first) ? first : second;
  }

  private boolean emailMatches(String value, String email) {
    return StringUtils.hasText(value) && StringUtils.hasText(email) && value.equalsIgnoreCase(email);
  }

  private boolean emailMatchesAny(Object value, String email) {
    if (value instanceof String text) {
      return emailMatches(text, email);
    }

    if (value instanceof Collection<?> values) {
      return values.stream()
          .filter(Objects::nonNull)
          .map(Object::toString)
          .anyMatch(candidate -> emailMatches(candidate, email));
    }

    return false;
  }

  private record TokenResponse(
      @JsonProperty("access_token")
      String accessToken,
      @JsonProperty("token_type")
      String tokenType,
      @JsonProperty("expires_in")
      String expiresIn,
      String scope,
      @JsonProperty("id_token")
      String idToken
  ) {
  }
}
