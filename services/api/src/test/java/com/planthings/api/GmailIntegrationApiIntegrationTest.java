package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.auth.OAuthProperties;
import com.planthings.api.settings.GmailOAuthClient;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "app.oauth.providers.google.client-id=test-google-client",
    "app.oauth.providers.google.client-secret=test-google-secret",
    "app.oauth.providers.google.authorization-uri=https://accounts.google.com/o/oauth2/v2/auth",
    "app.oauth.providers.google.token-uri=https://oauth2.googleapis.com/token",
    "app.oauth.providers.google.jwk-set-uri=https://www.googleapis.com/oauth2/v3/certs",
    "app.integrations.gmail.redirect-uri=http://localhost/api/settings/integrations/gmail/callback",
    "app.integrations.gmail.frontend-return-url=http://localhost/settings",
    "app.integrations.gmail.mobile-return-url=planthings://settings",
    "app.integrations.token-key-base64=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
})
class GmailIntegrationApiIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldStartGmailAuthorizationWithSendScopeAndOfflineAccess() throws Exception {
    String token = registerAndGetToken("Gmail Owner", "gmail-owner@example.com", "12345678");

    JsonNode response = readJson(mockMvc.perform(post("/api/settings/integrations/gmail/start")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.authorizationUrl").isNotEmpty())
        .andReturn());

    String authorizationUrl = response.path("data").path("authorizationUrl").asText();
    assertEquals("test-google-client", queryParam(authorizationUrl, "client_id"));
    assertEquals("http://localhost/api/settings/integrations/gmail/callback", queryParam(authorizationUrl, "redirect_uri"));
    assertEquals("offline", queryParam(authorizationUrl, "access_type"));
    assertEquals("true", queryParam(authorizationUrl, "include_granted_scopes"));
    assertEquals("consent", queryParam(authorizationUrl, "prompt"));
    assertTrue(queryParam(authorizationUrl, "scope").contains("https://www.googleapis.com/auth/gmail.send"));
    assertFalse(queryParam(authorizationUrl, "state").isBlank());
  }

  @Test
  void shouldConnectReportAndDisconnectGmail() throws Exception {
    String token = registerAndGetToken("Gmail Owner", "gmail-owner@example.com", "12345678");
    String state = startGmailAndReturnState(token);

    MvcResult callback = mockMvc.perform(get("/api/settings/integrations/gmail/callback")
            .queryParam("state", state)
            .queryParam("code", "gmail-owner"))
        .andExpect(status().isFound())
        .andReturn();

    String location = callback.getResponse().getHeader("Location");
    assertEquals("connected", queryParam(location, "gmail"));

    mockMvc.perform(get("/api/settings")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.integrations.gmail.connected").value(true))
        .andExpect(jsonPath("$.data.integrations.gmail.email").value("gmail-owner@example.com"))
        .andExpect(jsonPath("$.data.integrations.gmail.scopes[0]").value("https://www.googleapis.com/auth/gmail.send"));

    mockMvc.perform(delete("/api/settings/integrations/gmail")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.gmail.connected").value(false));

    mockMvc.perform(get("/api/settings")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.integrations.gmail.connected").value(false));
  }

  @Test
  void shouldRejectDifferentGmailAddress() throws Exception {
    String token = registerAndGetToken("Gmail Owner", "gmail-owner@example.com", "12345678");
    String state = startGmailAndReturnState(token);

    MvcResult callback = mockMvc.perform(get("/api/settings/integrations/gmail/callback")
            .queryParam("state", state)
            .queryParam("code", "gmail-other"))
        .andExpect(status().isFound())
        .andReturn();

    String location = callback.getResponse().getHeader("Location");
    assertEquals("error", queryParam(location, "gmail"));
    assertEquals("GMAIL_EMAIL_DIVERGENTE", queryParam(location, "error"));
  }

  @Test
  void shouldPreserveWebBackgroundRouteAcrossGmailCallback() throws Exception {
    String token = registerAndGetToken("Gmail Owner", "gmail-owner@example.com", "12345678");
    String state = startGmailAndReturnState(token, "web", "/files?view=shared#recent");

    MvcResult callback = mockMvc.perform(get("/api/settings/integrations/gmail/callback")
            .queryParam("state", state)
            .queryParam("code", "gmail-owner"))
        .andExpect(status().isFound())
        .andReturn();

    String location = callback.getResponse().getHeader("Location");
    assertEquals("http://localhost/settings", URI.create(location).getScheme() + "://" + URI.create(location).getHost() + URI.create(location).getPath());
    assertEquals("connected", queryParam(location, "gmail"));
    assertEquals("/files?view=shared#recent", queryParam(location, "background"));
  }

  @Test
  void shouldRejectMissingRefreshToken() throws Exception {
    String token = registerAndGetToken("Gmail Owner", "gmail-owner@example.com", "12345678");
    String state = startGmailAndReturnState(token);

    MvcResult callback = mockMvc.perform(get("/api/settings/integrations/gmail/callback")
            .queryParam("state", state)
            .queryParam("code", "gmail-no-refresh"))
        .andExpect(status().isFound())
        .andReturn();

    String location = callback.getResponse().getHeader("Location");
    assertEquals("error", queryParam(location, "gmail"));
    assertEquals("GMAIL_REFRESH_TOKEN_AUSENTE", queryParam(location, "error"));
  }

  @Test
  void shouldPreserveMobileReturnUrlWhenGmailAddressDiffers() throws Exception {
    String token = registerAndGetToken("Gmail Owner", "gmail-owner@example.com", "12345678");
    String state = startGmailAndReturnState(token, "mobile");

    MvcResult callback = mockMvc.perform(get("/api/settings/integrations/gmail/callback")
            .queryParam("state", state)
            .queryParam("code", "gmail-other"))
        .andExpect(status().isFound())
        .andReturn();

    String location = callback.getResponse().getHeader("Location");
    assertTrue(location.startsWith("planthings://settings"));
    assertEquals("error", queryParam(location, "gmail"));
    assertEquals("GMAIL_EMAIL_DIVERGENTE", queryParam(location, "error"));
  }

  @Test
  void shouldPreserveMobileReturnUrlWhenRefreshTokenIsMissing() throws Exception {
    String token = registerAndGetToken("Gmail Owner", "gmail-owner@example.com", "12345678");
    String state = startGmailAndReturnState(token, "mobile");

    MvcResult callback = mockMvc.perform(get("/api/settings/integrations/gmail/callback")
            .queryParam("state", state)
            .queryParam("code", "gmail-no-refresh"))
        .andExpect(status().isFound())
        .andReturn();

    String location = callback.getResponse().getHeader("Location");
    assertTrue(location.startsWith("planthings://settings"));
    assertEquals("error", queryParam(location, "gmail"));
    assertEquals("GMAIL_REFRESH_TOKEN_AUSENTE", queryParam(location, "error"));
  }

  private String startGmailAndReturnState(String token) throws Exception {
    return startGmailAndReturnState(token, null);
  }

  private String startGmailAndReturnState(String token, String client) throws Exception {
    return startGmailAndReturnState(token, client, null);
  }

  private String startGmailAndReturnState(String token, String client, String redirectTo) throws Exception {
    String body = """
        {
          "client": %s,
          "redirectTo": %s
        }
        """.formatted(
        client == null ? "null" : "\"" + client + "\"",
        redirectTo == null ? "null" : "\"" + redirectTo.replace("\\", "\\\\").replace("\"", "\\\"") + "\""
    );

    JsonNode start = readJson(mockMvc.perform(post("/api/settings/integrations/gmail/start")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isOk())
        .andReturn());

    return queryParam(start.path("data").path("authorizationUrl").asText(), "state");
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
  static class FakeGmailOAuthConfig {

    @Bean
    @Primary
    GmailOAuthClient fakeGmailOAuthClient() {
      return new FakeGmailOAuthClient();
    }
  }

  static class FakeGmailOAuthClient implements GmailOAuthClient {

    @Override
    public GmailTokenResponse exchangeCode(
        OAuthProperties.Provider config,
        String authorizationCode,
        String redirectUri,
        String expectedNonce
    ) {
      return switch (authorizationCode) {
        case "gmail-owner" -> new GmailTokenResponse(
            "gmail-owner@example.com",
            true,
            "refresh-token-owner",
            "https://www.googleapis.com/auth/gmail.send"
        );
        case "gmail-other" -> new GmailTokenResponse(
            "other@example.com",
            true,
            "refresh-token-other",
            "https://www.googleapis.com/auth/gmail.send"
        );
        case "gmail-no-refresh" -> new GmailTokenResponse(
            "gmail-owner@example.com",
            true,
            null,
            "https://www.googleapis.com/auth/gmail.send"
        );
        default -> throw new IllegalArgumentException("Unexpected fake Gmail code: " + authorizationCode);
      };
    }
  }
}
