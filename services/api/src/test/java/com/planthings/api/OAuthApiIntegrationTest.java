package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.auth.OAuthIdentity;
import com.planthings.api.auth.OAuthLoginStateEntity;
import com.planthings.api.auth.OAuthLoginStateRepository;
import com.planthings.api.auth.OAuthProperties;
import com.planthings.api.auth.OidcProviderClient;
import com.planthings.api.auth.UserRepository;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "app.oauth.frontend-callback-url=http://localhost/oauth/callback",
    "app.oauth.web-callback-url=http://localhost/oauth/callback",
    "app.oauth.mobile-callback-url=planthings://oauth/callback",
    "app.oauth.providers.google.client-id=test-google-client",
    "app.oauth.providers.google.client-secret=test-google-secret",
    "app.oauth.providers.google.authorization-uri=https://accounts.google.com/o/oauth2/v2/auth",
    "app.oauth.providers.google.token-uri=https://oauth2.googleapis.com/token",
    "app.oauth.providers.google.redirect-uri=http://localhost/api/auth/oauth/google/callback",
    "app.oauth.providers.google.jwk-set-uri=https://www.googleapis.com/oauth2/v3/certs",
    "app.oauth.providers.microsoft.client-id=test-microsoft-client",
    "app.oauth.providers.microsoft.client-secret=test-microsoft-secret",
    "app.oauth.providers.microsoft.authorization-uri=https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    "app.oauth.providers.microsoft.token-uri=https://login.microsoftonline.com/common/oauth2/v2.0/token",
    "app.oauth.providers.microsoft.redirect-uri=http://localhost/api/auth/oauth/microsoft/callback",
    "app.oauth.providers.microsoft.jwk-set-uri=https://login.microsoftonline.com/common/discovery/v2.0/keys"
})
class OAuthApiIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private OAuthLoginStateRepository stateRepository;

  @Autowired
  private UserRepository userRepository;

  @Test
  void shouldCreateUserAndReuseExistingExternalIdentity() throws Exception {
    String firstCompletionCode = completeProviderCallback("google", "google-new", "/settings");

    JsonNode firstSession = exchangeCompletionCode(firstCompletionCode);
    String firstUserId = firstSession.path("data").path("user").path("id").asText();

    assertFalse(firstSession.path("data").path("accessToken").asText().isBlank());
    assertEquals("oauth-new@example.com", firstSession.path("data").path("user").path("email").asText());
    assertFalse(firstSession.path("data").path("user").path("localPasswordEnabled").asBoolean());
    assertTrue(firstSession.path("data").path("user").path("externalIdentityLinked").asBoolean());
    org.junit.jupiter.api.Assertions.assertNull(userRepository.findByEmailIgnoreCase("oauth-new@example.com").orElseThrow().getPasswordHash());

    String secondCompletionCode = completeProviderCallback("google", "google-again", "/settings");
    JsonNode secondSession = exchangeCompletionCode(secondCompletionCode);

    assertEquals(firstUserId, secondSession.path("data").path("user").path("id").asText());
  }

  @Test
  void shouldRejectCompletionCodeReplay() throws Exception {
    String completionCode = completeProviderCallback("google", "google-new", "/settings");

    exchangeCompletionCode(completionCode);

    mockMvc.perform(post("/api/auth/oauth/exchange")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "code": "%s"
                }
                """.formatted(completionCode)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("OAUTH_COMPLETION_CODE_EXPIRADO"));
  }

  @Test
  void shouldAutoLinkVerifiedEmailToExistingPasswordAccount() throws Exception {
    JsonNode registered = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Arthur Existing",
                  "email": "existing@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn());
    String registeredUserId = registered.path("data").path("user").path("id").asText();

    String completionCode = completeProviderCallback("google", "google-existing-email", "/workspace");
    JsonNode oauthSession = exchangeCompletionCode(completionCode);

    assertEquals(registeredUserId, oauthSession.path("data").path("user").path("id").asText());
    assertEquals("existing@example.com", oauthSession.path("data").path("user").path("email").asText());
  }

  @Test
  void shouldRejectMicrosoftEmailAutoLinkWithoutStrongEmailProof() throws Exception {
    JsonNode registered = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Microsoft Existing",
                  "email": "microsoft-existing@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn());
    String registeredUserId = registered.path("data").path("user").path("id").asText();

    String location = completeProviderCallbackLocation("microsoft", "microsoft-existing-email", "/workspace");

    assertEquals("VINCULO_OAUTH_REQUER_LOGIN", queryParam(location, "error"));
    assertEquals("", queryParam(location, "code"));

    JsonNode login = readJson(mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "microsoft-existing@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn());
    assertEquals(registeredUserId, login.path("data").path("user").path("id").asText());
  }

  @Test
  void shouldRejectMissingOrUnverifiedOAuthEmail() throws Exception {
    String missingEmailLocation = completeProviderCallbackLocation("google", "google-no-email", null);
    assertEquals("EMAIL_OBRIGATORIO", queryParam(missingEmailLocation, "error"));

    String unverifiedEmailLocation = completeProviderCallbackLocation("google", "google-unverified", null);
    assertEquals("EMAIL_OAUTH_NAO_VERIFICADO", queryParam(unverifiedEmailLocation, "error"));
  }

  @Test
  void shouldRejectInvalidOrExpiredState() throws Exception {
    mockMvc.perform(get("/api/auth/oauth/google/callback")
            .queryParam("state", "missing-state")
            .queryParam("code", "google-new"))
        .andExpect(status().isFound())
        .andExpect(result -> assertEquals(
            "ESTADO_OAUTH_INVALIDO",
            queryParam(result.getResponse().getHeader("Location"), "error")
        ));

    String state = startOAuthAndReturnState("google", null);
    OAuthLoginStateEntity stateEntity = stateRepository.findByStateToken(state).orElseThrow();
    stateEntity.setExpiresAt(OffsetDateTime.now().minusMinutes(1));
    stateRepository.save(stateEntity);

    mockMvc.perform(get("/api/auth/oauth/google/callback")
            .queryParam("state", state)
            .queryParam("code", "google-new"))
        .andExpect(status().isFound())
        .andExpect(result -> assertEquals(
            "ESTADO_OAUTH_EXPIRADO",
            queryParam(result.getResponse().getHeader("Location"), "error")
        ));
  }

  @Test
  void shouldRejectStateReplay() throws Exception {
    String state = startOAuthAndReturnState("google", null);

    mockMvc.perform(get("/api/auth/oauth/google/callback")
            .queryParam("state", state)
            .queryParam("code", "google-new"))
        .andExpect(status().isFound())
        .andExpect(result -> assertFalse(queryParam(result.getResponse().getHeader("Location"), "code").isBlank()));

    mockMvc.perform(get("/api/auth/oauth/google/callback")
            .queryParam("state", state)
            .queryParam("code", "google-new"))
        .andExpect(status().isFound())
        .andExpect(result -> assertEquals(
            "ESTADO_OAUTH_EXPIRADO",
            queryParam(result.getResponse().getHeader("Location"), "error")
        ));
  }

  @Test
  void shouldAllowOAuthAccountToSetupLocalPasswordWithoutCurrentPassword() throws Exception {
    String completionCode = completeProviderCallback("google", "google-new", "/settings");
    JsonNode session = exchangeCompletionCode(completionCode);
    String token = session.path("data").path("accessToken").asText();

    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "oauth-new@example.com",
                  "password": "local-password"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("SENHA_LOCAL_NAO_CONFIGURADA"));

    mockMvc.perform(post("/api/settings/password/setup")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "newPassword": "local-password"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Senha configurada com sucesso."));

    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "oauth-new@example.com",
                  "password": "local-password"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.user.localPasswordEnabled").value(true))
        .andExpect(jsonPath("$.data.user.externalIdentityLinked").value(true));

    mockMvc.perform(post("/api/settings/password/setup")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "newPassword": "another-password"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("SENHA_LOCAL_JA_CONFIGURADA"));

    mockMvc.perform(patch("/api/settings/password")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "currentPassword": "local-password",
                  "newPassword": "another-password"
                }
                """))
        .andExpect(status().isOk());
  }

  @Test
  void shouldPreserveMobileCallbackWhenFailureHappensAfterStateConsumption() throws Exception {
    String state = startOAuthAndReturnState("google", null, "mobile");

    MvcResult callback = mockMvc.perform(get("/api/auth/oauth/google/callback")
            .queryParam("state", state)
            .queryParam("code", "google-exchange-fails"))
        .andExpect(status().isFound())
        .andReturn();

    String location = callback.getResponse().getHeader("Location");
    assertTrue(location.startsWith("planthings://oauth/callback"));
    assertEquals("OAUTH_CALLBACK_FALHOU", queryParam(location, "error"));
  }

  @Test
  void shouldPreserveOnlyAllowedRedirectPaths() throws Exception {
    String allowedLocation = completeProviderCallbackLocation("google", "google-new", "/settings?tab=account");
    assertEquals("/settings?tab=account", queryParam(allowedLocation, "redirectTo"));

    String blockedLocation = completeProviderCallbackLocation("google", "google-again", "https://evil.example/settings");
    assertEquals("", queryParam(blockedLocation, "redirectTo"));
  }

  @Test
  void shouldRejectUnsupportedProviderStart() throws Exception {
    mockMvc.perform(post("/api/auth/oauth/github/start")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("PROVEDOR_OAUTH_INVALIDO"));
  }

  @Test
  void shouldAcceptMicrosoftCommonIdentity() throws Exception {
    String completionCode = completeProviderCallback("microsoft", "microsoft-common", "/calendar");
    JsonNode session = exchangeCompletionCode(completionCode);

    assertFalse(session.path("data").path("accessToken").asText().isBlank());
    assertEquals("microsoft-user@example.com", session.path("data").path("user").path("email").asText());
  }

  private String completeProviderCallback(String provider, String providerCode, String redirectTo) throws Exception {
    String location = completeProviderCallbackLocation(provider, providerCode, redirectTo);
    String completionCode = queryParam(location, "code");
    assertFalse(completionCode.isBlank());
    if (redirectTo != null) {
      assertEquals(redirectTo, queryParam(location, "redirectTo"));
    }
    return completionCode;
  }

  private String completeProviderCallbackLocation(String provider, String providerCode, String redirectTo) throws Exception {
    String state = startOAuthAndReturnState(provider, redirectTo);
    MvcResult callback = mockMvc.perform(get("/api/auth/oauth/" + provider + "/callback")
            .queryParam("state", state)
            .queryParam("code", providerCode))
        .andExpect(status().isFound())
        .andReturn();

    String location = callback.getResponse().getHeader("Location");
    assertTrue(location.startsWith("http://localhost/oauth/callback"));
    return location;
  }

  private String startOAuthAndReturnState(String provider, String redirectTo) throws Exception {
    return startOAuthAndReturnState(provider, redirectTo, null);
  }

  private String startOAuthAndReturnState(String provider, String redirectTo, String client) throws Exception {
    String body;
    if (redirectTo == null && client == null) {
      body = "{}";
    } else if (redirectTo == null) {
      body = """
        {
          "client": "%s"
        }
        """.formatted(client);
    } else if (client == null) {
      body = """
        {
          "redirectTo": "%s"
        }
        """.formatted(redirectTo);
    } else {
      body = """
        {
          "redirectTo": "%s",
          "client": "%s"
        }
        """.formatted(redirectTo, client);
    }

    JsonNode start = readJson(mockMvc.perform(post("/api/auth/oauth/" + provider + "/start")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.authorizationUrl").isNotEmpty())
        .andReturn());

    return queryParam(start.path("data").path("authorizationUrl").asText(), "state");
  }

  private JsonNode exchangeCompletionCode(String completionCode) throws Exception {
    return readJson(mockMvc.perform(post("/api/auth/oauth/exchange")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "code": "%s"
                }
                """.formatted(completionCode)))
        .andExpect(status().isOk())
        .andReturn());
  }

  private String queryParam(String uri, String name) {
    String rawQuery = URI.create(uri).getRawQuery();
    if (rawQuery == null) {
      return "";
    }

    return Arrays.stream(rawQuery.split("&"))
        .map(part -> part.split("=", 2))
        .filter(parts -> parts.length == 2)
        .filter(parts -> URLDecoder.decode(parts[0], StandardCharsets.UTF_8).equals(name))
        .map(parts -> URLDecoder.decode(parts[1], StandardCharsets.UTF_8))
        .findFirst()
        .orElse("");
  }

  @TestConfiguration
  static class FakeOidcProviderConfig {

    @Bean
    @Primary
    OidcProviderClient fakeOidcProviderClient() {
      return new FakeOidcProviderClient();
    }
  }

  static class FakeOidcProviderClient implements OidcProviderClient {

    @Override
    public OAuthIdentity exchangeCode(
        String provider,
        OAuthProperties.Provider config,
        String authorizationCode,
        String expectedNonce
    ) {
      return switch (authorizationCode) {
        case "google-new", "google-again" -> new OAuthIdentity(
            "google",
            "google-subject-1",
            "oauth-new@example.com",
            true,
            true,
            "OAuth New",
            "https://example.com/avatar.png"
        );
        case "google-existing-email" -> new OAuthIdentity(
            "google",
            "google-subject-existing",
            "existing@example.com",
            true,
            true,
            "Arthur Existing",
            null
        );
        case "google-no-email" -> new OAuthIdentity(
            "google",
            "google-subject-no-email",
            null,
            true,
            true,
            "No Email",
            null
        );
        case "google-unverified" -> new OAuthIdentity(
            "google",
            "google-subject-unverified",
            "unverified@example.com",
            false,
            false,
            "Unverified",
            null
        );
        case "microsoft-common" -> new OAuthIdentity(
            "microsoft",
            "tenant-1:object-1",
            "microsoft-user@example.com",
            true,
            false,
            "Microsoft User",
            null
        );
        case "microsoft-existing-email" -> new OAuthIdentity(
            "microsoft",
            "tenant-1:object-existing",
            "microsoft-existing@example.com",
            true,
            false,
            "Microsoft Existing",
            null
        );
        default -> throw new IllegalArgumentException("Unexpected fake OAuth code: " + authorizationCode);
      };
    }
  }
}
