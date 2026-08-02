package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.plans.PlanInviteRepository;
import com.planthings.api.settings.GmailApiClient;
import com.planthings.api.settings.GmailConnectionEntity;
import com.planthings.api.settings.GmailConnectionRepository;
import com.planthings.api.settings.GmailIntegrationProperties;
import com.planthings.api.settings.IntegrationTokenCipher;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class PlanInviteGmailIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private GmailConnectionRepository gmailConnectionRepository;

  @Autowired
  private IntegrationTokenCipher tokenCipher;

  @Autowired
  private PlanInviteRepository planInviteRepository;

  @Autowired
  private RecordingGmailApiClient gmailApiClient;

  @BeforeEach
  void resetFakeClient() {
    gmailApiClient.reset();
  }

  @Test
  void shouldSendInviteWithConnectedGmailAndPersistPendingInvite() throws Exception {
    JsonNode ownerSession = register("Gmail Owner", "owner-gmail-invite@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode createdPlan = createPlan(ownerToken, "Plano Gmail");
    String planId = createdPlan.path("plan").path("id").asText();
    saveGmailConnection(ownerId, "owner-gmail-invite@example.com");

    JsonNode invite = readJson(mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "invitee-gmail@example.com"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("PENDING"))
        .andExpect(jsonPath("$.data.delivery.emailSent").value(true))
        .andExpect(jsonPath("$.data.delivery.sentTo").value("invitee-gmail@example.com"))
        .andExpect(jsonPath("$.data.delivery.sentFrom").value("owner-gmail-invite@example.com"))
        .andReturn()).path("data");

    String decodedMime = gmailApiClient.decodedRawMessage();
    assertTrue(decodedMime.contains("To: invitee-gmail@example.com"));
    assertTrue(decodedMime.contains("From: owner-gmail-invite@example.com"));
    assertTrue(decodedMime.contains("Content-Transfer-Encoding: base64"));

    String decodedTextPart = decodeBase64Part(decodedMime, "Content-Type: text/plain; charset=UTF-8");
    assertTrue(decodedTextPart.contains("Olá,"));
    assertTrue(decodedTextPart.contains("convidou você para participar"));
    assertTrue(decodedTextPart.contains("Plano Gmail"));
    assertTrue(decodedTextPart.contains("http://localhost:5173/plans/invites/" + invite.path("token").asText()));
  }

  @Test
  void shouldRejectInviteWithoutConnectedGmailAndNotCreatePendingInvite() throws Exception {
    JsonNode ownerSession = register("No Gmail Owner", "owner-no-gmail@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    JsonNode createdPlan = createPlan(ownerToken, "Plano sem Gmail");
    String planId = createdPlan.path("plan").path("id").asText();

    mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "missing-gmail@example.com"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("GMAIL_NAO_CONECTADO"));

    assertEquals(0, planInviteRepository.findByPlanIdOrderByCreatedAtDesc(java.util.UUID.fromString(planId)).size());
  }

  @Test
  void shouldRejectInviteWhenRefreshTokenFailsAndRememberLastError() throws Exception {
    JsonNode ownerSession = register("Refresh Owner", "owner-refresh-gmail@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode createdPlan = createPlan(ownerToken, "Plano refresh");
    String planId = createdPlan.path("plan").path("id").asText();
    saveGmailConnection(ownerId, "owner-refresh-gmail@example.com");
    gmailApiClient.refreshErrorCode = "GMAIL_TOKEN_REFRESH_FALHOU";

    mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "refresh-failure@example.com"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("GMAIL_TOKEN_REFRESH_FALHOU"));

    assertEquals(0, planInviteRepository.findByPlanIdOrderByCreatedAtDesc(java.util.UUID.fromString(planId)).size());
    mockMvc.perform(get("/api/settings")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.integrations.gmail.lastError").value("GMAIL_TOKEN_REFRESH_FALHOU"));
  }

  @Test
  void shouldRejectInviteWhenGmailSendFailsAndNotCreatePendingInvite() throws Exception {
    JsonNode ownerSession = register("Send Owner", "owner-send-gmail@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode createdPlan = createPlan(ownerToken, "Plano send");
    String planId = createdPlan.path("plan").path("id").asText();
    saveGmailConnection(ownerId, "owner-send-gmail@example.com");
    gmailApiClient.sendErrorCode = "GMAIL_ENVIO_CONVITE_FALHOU";

    mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "send-failure@example.com"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("GMAIL_ENVIO_CONVITE_FALHOU"));

    assertEquals(0, planInviteRepository.findByPlanIdOrderByCreatedAtDesc(java.util.UUID.fromString(planId)).size());
  }

  @Test
  void shouldKeepDuplicatePendingInviteConflict() throws Exception {
    JsonNode ownerSession = register("Duplicate Owner", "owner-duplicate-gmail@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode createdPlan = createPlan(ownerToken, "Plano duplicado");
    String planId = createdPlan.path("plan").path("id").asText();
    saveGmailConnection(ownerId, "owner-duplicate-gmail@example.com");

    mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "duplicate@example.com"
                }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "duplicate@example.com"
                }
                """))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error.code").value("CONVITE_PENDENTE"));
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

  private String decodeBase64Part(String mimeMessage, String contentType) {
    int contentTypeIndex = mimeMessage.indexOf(contentType);
    int encodingIndex = mimeMessage.indexOf("Content-Transfer-Encoding: base64", contentTypeIndex);
    int bodyStart = mimeMessage.indexOf("\r\n\r\n", encodingIndex);
    int bodyEnd = mimeMessage.indexOf("\r\n--", bodyStart + 4);
    String encodedBody = mimeMessage.substring(bodyStart + 4, bodyEnd).replace("\r", "").replace("\n", "");
    return new String(Base64.getDecoder().decode(encodedBody), StandardCharsets.UTF_8);
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
    String rawMessage;

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
      this.rawMessage = rawMessage;
      return new GmailSendResponse("message-id", "thread-id");
    }

    String decodedRawMessage() {
      return new String(Base64.getUrlDecoder().decode(rawMessage), StandardCharsets.UTF_8);
    }

    void reset() {
      refreshErrorCode = null;
      sendErrorCode = null;
      rawMessage = null;
    }
  }
}
