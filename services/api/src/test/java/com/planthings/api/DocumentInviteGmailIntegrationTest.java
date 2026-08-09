package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.settings.GmailApiClient;
import com.planthings.api.settings.GmailConnectionEntity;
import com.planthings.api.settings.GmailConnectionRepository;
import com.planthings.api.settings.GmailIntegrationProperties;
import com.planthings.api.settings.IntegrationTokenCipher;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "app.oauth.providers.google.client-id=test-google-client",
    "app.oauth.providers.google.client-secret=test-google-secret",
    "app.oauth.providers.google.token-uri=https://oauth2.googleapis.com/token",
    "app.frontend-base-url=http://localhost:5173",
    "app.integrations.token-key-base64=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
})
class DocumentInviteGmailIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private GmailConnectionRepository gmailConnectionRepository;

  @Autowired
  private IntegrationTokenCipher tokenCipher;

  @Autowired
  private RecordingGmailApiClient gmailApiClient;

  @BeforeEach
  void resetFakeClient() {
    gmailApiClient.reset();
  }

  @Test
  void shouldCreatePendingInviteWhenGmailSendFails() throws Exception {
    JsonNode ownerSession = register("Doc Gmail Owner", "owner-doc-gmail-invite@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    String documentId = createDocument(ownerToken);
    saveGmailConnection(ownerId, "owner-doc-gmail-invite@example.com");
    gmailApiClient.sendErrorCode = "GMAIL_ENVIO_CONVITE_FALHOU";

    mockMvc.perform(post("/api/documents/" + documentId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "doc-invitee@example.com",
                  "role": "EDITOR"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("PENDING"))
        .andExpect(jsonPath("$.data.delivery.emailSent").value(false))
        .andExpect(jsonPath("$.data.delivery.sentTo").value("doc-invitee@example.com"))
        .andExpect(jsonPath("$.data.inviteUrl").isNotEmpty());
  }

  @Test
  void shouldCreatePendingInviteWhenGmailTokenRefreshFails() throws Exception {
    JsonNode ownerSession = register("Doc Refresh Owner", "owner-doc-gmail-refresh@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    String documentId = createDocument(ownerToken);
    saveGmailConnection(ownerId, "owner-doc-gmail-refresh@example.com");
    gmailApiClient.refreshErrorCode = "GMAIL_TOKEN_REFRESH_FALHOU";

    mockMvc.perform(post("/api/documents/" + documentId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "doc-refresh-invitee@example.com",
                  "role": "VIEWER"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("PENDING"))
        .andExpect(jsonPath("$.data.delivery.emailSent").value(false))
        .andExpect(jsonPath("$.data.role").value("VIEWER"));
  }

  private JsonNode register(String name, String email) throws Exception {
    return readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "%s",
                  "email": "%s",
                  "password": "12345678"
                }
                """.formatted(name, email)))
        .andExpect(status().isOk())
        .andReturn()).path("data");
  }

  private String createDocument(String token) throws Exception {
    return readJson(mockMvc.perform(post("/api/documents")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Documento convite",
                  "description": "",
                  "contentMarkdown": "# Ola"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("document").path("id").asText();
  }

  private void saveGmailConnection(String userId, String email) {
    GmailConnectionEntity connection = new GmailConnectionEntity();
    connection.setUserId(java.util.UUID.fromString(userId));
    connection.setEmail(email);
    connection.setScopes(GmailIntegrationProperties.GMAIL_SEND_SCOPE);
    connection.setEncryptedRefreshToken(tokenCipher.encrypt("refresh-token-" + email));
    connection.setConnectedAt(OffsetDateTime.now());
    connection.setLastCheckedAt(OffsetDateTime.now());
    gmailConnectionRepository.save(connection);
  }

  @TestConfiguration
  static class FakeGmailApiConfig {

    @Bean
    @Primary
    RecordingGmailApiClient recordingGmailApiClient() {
      return new RecordingGmailApiClient();
    }
  }

  static class RecordingGmailApiClient implements GmailApiClient {

    String refreshErrorCode;
    String sendErrorCode;

    @Override
    public GmailAccessToken refreshAccessToken(com.planthings.api.auth.OAuthProperties.Provider config, String refreshToken) {
      if (refreshErrorCode != null) {
        throw new BadRequestException(refreshErrorCode, "Falha fake no refresh Gmail.");
      }
      return new GmailAccessToken("access-token", GmailIntegrationProperties.GMAIL_SEND_SCOPE);
    }

    @Override
    public GmailSendResponse sendMessage(String accessToken, String rawMessage) {
      if (sendErrorCode != null) {
        throw new BadRequestException(sendErrorCode, "Falha fake no envio Gmail.");
      }
      return new GmailSendResponse("message-id", "thread-id");
    }

    void reset() {
      refreshErrorCode = null;
      sendErrorCode = null;
    }
  }
}
