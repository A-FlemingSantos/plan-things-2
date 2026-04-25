package com.planthings.api.settings;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.planthings.api.auth.OAuthProperties;
import com.planthings.api.common.error.BadRequestException;
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
public class DefaultGmailOAuthClient implements GmailOAuthClient {

  private final RestClient restClient;
  private final Map<String, JwtDecoder> decoders = new ConcurrentHashMap<>();

  public DefaultGmailOAuthClient(RestClient.Builder restClientBuilder) {
    this.restClient = restClientBuilder.build();
  }

  @Override
  public GmailTokenResponse exchangeCode(
      OAuthProperties.Provider config,
      String authorizationCode,
      String redirectUri,
      String expectedNonce
  ) {
    TokenResponse tokenResponse = exchangeAuthorizationCode(config, authorizationCode, redirectUri);

    if (!StringUtils.hasText(tokenResponse.idToken())) {
      throw new BadRequestException("GMAIL_TOKEN_EXCHANGE_FALHOU", "O Google nao retornou um token de identidade.");
    }

    Jwt jwt = decodeIdToken(config, tokenResponse.idToken());
    validateGoogleClaims(config, jwt, expectedNonce);

    return new GmailTokenResponse(
        jwt.getClaimAsString("email"),
        Boolean.TRUE.equals(jwt.getClaim("email_verified")),
        tokenResponse.refreshToken(),
        tokenResponse.scope()
    );
  }

  private TokenResponse exchangeAuthorizationCode(
      OAuthProperties.Provider config,
      String authorizationCode,
      String redirectUri
  ) {
    LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("grant_type", "authorization_code");
    form.add("code", authorizationCode);
    form.add("client_id", config.getClientId());
    form.add("client_secret", config.getClientSecret());
    form.add("redirect_uri", redirectUri);

    try {
      return restClient.post()
          .uri(config.getTokenUri())
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(form)
          .retrieve()
          .body(TokenResponse.class);
    } catch (RuntimeException exception) {
      throw new BadRequestException("GMAIL_TOKEN_EXCHANGE_FALHOU", "Nao foi possivel validar a conexao Gmail.");
    }
  }

  private Jwt decodeIdToken(OAuthProperties.Provider config, String idToken) {
    JwtDecoder decoder = decoders.computeIfAbsent("google", ignored -> NimbusJwtDecoder.withJwkSetUri(config.getJwkSetUri()).build());

    try {
      return decoder.decode(idToken);
    } catch (JwtException exception) {
      throw new BadRequestException("GMAIL_TOKEN_EXCHANGE_FALHOU", "O token de identidade do Google e invalido.");
    }
  }

  private void validateGoogleClaims(OAuthProperties.Provider config, Jwt jwt, String expectedNonce) {
    if (!jwt.getAudience().contains(config.getClientId())) {
      throw new BadRequestException("GMAIL_TOKEN_EXCHANGE_FALHOU", "O token de identidade foi emitido para outro cliente.");
    }

    if (!Objects.equals(jwt.getClaimAsString("nonce"), expectedNonce)) {
      throw new BadRequestException("GMAIL_TOKEN_EXCHANGE_FALHOU", "A validacao de seguranca da conexao Gmail expirou.");
    }

    String issuer = jwt.getIssuer() == null ? "" : jwt.getIssuer().toString();
    if (!("https://accounts.google.com".equals(issuer) || "accounts.google.com".equals(issuer))) {
      throw new BadRequestException("GMAIL_TOKEN_EXCHANGE_FALHOU", "O emissor do Google nao e confiavel.");
    }
  }

  private record TokenResponse(
      @JsonProperty("access_token")
      String accessToken,
      @JsonProperty("refresh_token")
      String refreshToken,
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
