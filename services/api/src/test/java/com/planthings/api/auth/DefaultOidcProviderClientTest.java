package com.planthings.api.auth;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.planthings.api.common.error.BadRequestException;
import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DefaultOidcProviderClientTest {

  private static final String CLIENT_ID = "test-client-id";
  private static final String NONCE = "expected-nonce";

  private HttpServer server;
  private RSAKey rsaKey;
  private String tokenResponseBody;
  private DefaultOidcProviderClient client;

  @BeforeEach
  void setUp() throws Exception {
    rsaKey = new RSAKeyGenerator(2048)
        .keyID("test-key")
        .generate();
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/token", exchange -> sendJson(exchange, tokenResponseBody));
    server.createContext("/jwks", exchange -> sendJson(exchange, new JWKSet(rsaKey.toPublicJWK()).toString()));
    server.start();
    client = new DefaultOidcProviderClient(RestClient.builder());
  }

  @AfterEach
  void tearDown() {
    if (server != null) {
      server.stop(0);
    }
  }

  @Test
  void shouldValidateGoogleIdTokenClaimsAndSignature() throws Exception {
    tokenResponseBody = tokenResponse(signedToken("https://accounts.google.com", "google-subject", List.of(CLIENT_ID), NONCE)
        .claim("email", "person@example.com")
        .claim("email_verified", true)
        .claim("name", "OAuth Person")
        .claim("picture", "https://example.com/avatar.png")
        .build());

    OAuthIdentity identity = client.exchangeCode("google", providerConfig(), "authorization-code", NONCE);

    assertEquals("google", identity.provider());
    assertEquals("google-subject", identity.providerSubject());
    assertEquals("person@example.com", identity.email());
    assertTrue(identity.emailVerified());
    assertTrue(identity.emailAutoLinkTrusted());
    assertEquals("OAuth Person", identity.displayName());
    assertEquals("https://example.com/avatar.png", identity.avatarUrl());
  }

  @Test
  void shouldRejectInvalidNonce() throws Exception {
    tokenResponseBody = tokenResponse(signedToken("https://accounts.google.com", "google-subject", List.of(CLIENT_ID), "other-nonce")
        .claim("email", "person@example.com")
        .claim("email_verified", true)
        .build());

    BadRequestException exception = assertThrows(
        BadRequestException.class,
        () -> client.exchangeCode("google", providerConfig(), "authorization-code", NONCE)
    );

    assertEquals("OAUTH_NONCE_INVALIDO", exception.getCode());
  }

  @Test
  void shouldRejectInvalidAudience() throws Exception {
    tokenResponseBody = tokenResponse(signedToken("https://accounts.google.com", "google-subject", List.of("other-client"), NONCE)
        .claim("email", "person@example.com")
        .claim("email_verified", true)
        .build());

    BadRequestException exception = assertThrows(
        BadRequestException.class,
        () -> client.exchangeCode("google", providerConfig(), "authorization-code", NONCE)
    );

    assertEquals("OAUTH_AUDIENCE_INVALIDA", exception.getCode());
  }

  @Test
  void shouldRejectExpiredToken() throws Exception {
    tokenResponseBody = tokenResponse(signedToken("https://accounts.google.com", "google-subject", List.of(CLIENT_ID), NONCE)
        .expirationTime(Date.from(Instant.now().minusSeconds(60)))
        .claim("email", "person@example.com")
        .claim("email_verified", true)
        .build());

    BadRequestException exception = assertThrows(
        BadRequestException.class,
        () -> client.exchangeCode("google", providerConfig(), "authorization-code", NONCE)
    );

    assertEquals("OAUTH_ID_TOKEN_INVALIDO", exception.getCode());
  }

  @Test
  void shouldParseMicrosoftTenantObjectAndVerifiedPrimaryEmail() throws Exception {
    tokenResponseBody = tokenResponse(signedToken(
            "https://login.microsoftonline.com/tenant-123/v2.0",
            "fallback-subject",
            List.of(CLIENT_ID),
            NONCE
        )
        .claim("tid", "tenant-123")
        .claim("oid", "object-456")
        .claim("preferred_username", "person@example.com")
        .claim("verified_primary_email", List.of("person@example.com"))
        .claim("name", "Microsoft Person")
        .build());

    OAuthIdentity identity = client.exchangeCode("microsoft", providerConfig(), "authorization-code", NONCE);

    assertEquals("microsoft", identity.provider());
    assertEquals("tenant-123:object-456", identity.providerSubject());
    assertEquals("person@example.com", identity.email());
    assertTrue(identity.emailVerified());
    assertTrue(identity.emailAutoLinkTrusted());
    assertEquals("Microsoft Person", identity.displayName());
  }

  @Test
  void shouldTreatMicrosoftDomainOwnerVerifiedAsLoginVerifiedButNotAutoLinkTrusted() throws Exception {
    tokenResponseBody = tokenResponse(signedToken(
            "https://login.microsoftonline.com/tenant-123/v2.0",
            "fallback-subject",
            List.of(CLIENT_ID),
            NONCE
        )
        .claim("tid", "tenant-123")
        .claim("oid", "object-456")
        .claim("preferred_username", "person@example.com")
        .claim("xms_edov", true)
        .build());

    OAuthIdentity identity = client.exchangeCode("microsoft", providerConfig(), "authorization-code", NONCE);

    assertTrue(identity.emailVerified());
    assertFalse(identity.emailAutoLinkTrusted());
  }

  private OAuthProperties.Provider providerConfig() {
    OAuthProperties.Provider provider = new OAuthProperties.Provider();
    provider.setClientId(CLIENT_ID);
    provider.setClientSecret("test-client-secret");
    provider.setTokenUri(baseUrl() + "/token");
    provider.setRedirectUri("http://localhost/api/auth/oauth/google/callback");
    provider.setJwkSetUri(baseUrl() + "/jwks");
    return provider;
  }

  private String baseUrl() {
    return "http://127.0.0.1:" + server.getAddress().getPort();
  }

  private JWTClaimsSet.Builder signedToken(String issuer, String subject, List<String> audience, String nonce) {
    return new JWTClaimsSet.Builder()
        .issuer(issuer)
        .subject(subject)
        .audience(audience)
        .issueTime(Date.from(Instant.now().minusSeconds(30)))
        .expirationTime(Date.from(Instant.now().plusSeconds(300)))
        .claim("nonce", nonce);
  }

  private String tokenResponse(JWTClaimsSet claims) throws Exception {
    SignedJWT jwt = new SignedJWT(
        new JWSHeader.Builder(JWSAlgorithm.RS256)
            .keyID(rsaKey.getKeyID())
            .build(),
        claims
    );
    jwt.sign(new RSASSASigner(rsaKey));
    return """
        {
          "access_token": "external-access-token",
          "token_type": "Bearer",
          "expires_in": 3600,
          "scope": "openid profile email",
          "id_token": "%s"
        }
        """.formatted(jwt.serialize());
  }

  private void sendJson(com.sun.net.httpserver.HttpExchange exchange, String body) throws java.io.IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(200, bytes.length);
    try (OutputStream outputStream = exchange.getResponseBody()) {
      outputStream.write(bytes);
    }
  }
}
