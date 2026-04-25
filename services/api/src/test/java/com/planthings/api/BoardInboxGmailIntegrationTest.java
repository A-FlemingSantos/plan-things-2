package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.plans.PlanMemberRepository;
import com.planthings.api.plans.PlanMemberRole;
import com.planthings.api.settings.GmailApiClient;
import com.planthings.api.settings.GmailConnectionEntity;
import com.planthings.api.settings.GmailConnectionRepository;
import com.planthings.api.settings.GmailIntegrationProperties;
import com.planthings.api.settings.IntegrationTokenCipher;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasItems;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class BoardInboxGmailIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private GmailConnectionRepository gmailConnectionRepository;

  @Autowired
  private IntegrationTokenCipher tokenCipher;

  @Autowired
  private PlanMemberRepository planMemberRepository;

  @Autowired
  private RecordingGmailApiClient gmailApiClient;

  @BeforeEach
  void resetFakeClient() {
    gmailApiClient.reset();
  }

  @Test
  void shouldSendCardToNewManualMembersWithConnectedGmail() throws Exception {
    JsonNode ownerSession = register("Inbox Owner", "inbox-owner@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode memberSession = register("Inbox Member", "inbox-member@example.com");
    String memberId = memberSession.path("user").path("id").asText();
    String planId = createPlan(ownerToken, "Plano Inbox").path("plan").path("id").asText();
    addMember(planId, memberId);
    saveGmailConnection(ownerId, "inbox-owner@example.com", GmailIntegrationProperties.GMAIL_SEND_SCOPE);
    String cardId = createCard(ownerToken, planId, "Preparar pauta", "Card enviado pela Inbox", null);

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/inbox/send")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "recipientUserIds": ["%s"]
                }
                """.formatted(memberId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.emailSent").value(true))
        .andExpect(jsonPath("$.data.sentFrom").value("inbox-owner@example.com"))
        .andExpect(jsonPath("$.data.sentTo[0]").value("inbox-member@example.com"))
        .andExpect(jsonPath("$.data.messageId").value("message-id"))
        .andExpect(jsonPath("$.data.threadId").value("thread-id"))
        .andExpect(jsonPath("$.data.inboxItem.cardId").value(cardId))
        .andExpect(jsonPath("$.data.inboxItem.cardTitle").value("Preparar pauta"))
        .andExpect(jsonPath("$.data.inboxItem.recipients[0].id").value(memberId));

    String decodedMime = gmailApiClient.decodedRawMessage();
    assertTrue(decodedMime.contains("To: inbox-member@example.com"));
    assertTrue(decodedMime.contains("From: inbox-owner@example.com"));
    assertTrue(decodeBase64Part(decodedMime, "Content-Type: text/plain; charset=UTF-8").contains("Preparar pauta"));
    assertTrue(decodeBase64Part(decodedMime, "Content-Type: text/plain; charset=UTF-8").contains("http://localhost:5173/workspace/board/" + planId));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.inboxItems[0].cardId").value(cardId))
        .andExpect(jsonPath("$.data.inboxItems[0].cardTitle").value("Preparar pauta"))
        .andExpect(jsonPath("$.data.inboxItems[0].sentFrom").value("inbox-owner@example.com"))
        .andExpect(jsonPath("$.data.inboxItems[0].sentTo[0]").value("inbox-member@example.com"))
        .andExpect(jsonPath("$.data.inboxItems[0].recipients[0].id").value(memberId))
        .andExpect(jsonPath("$.data.inboxItems[0].messageId").value("message-id"))
        .andExpect(jsonPath("$.data.inboxItems[0].threadId").value("thread-id"));
  }

  @Test
  void shouldSendCardToManualRecipientsWhenCardHasNoAssignees() throws Exception {
    JsonNode ownerSession = register("Manual Owner", "manual-owner@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode memberSession = register("Manual Member", "manual-member@example.com");
    String memberId = memberSession.path("user").path("id").asText();
    String planId = createPlan(ownerToken, "Plano Manual").path("plan").path("id").asText();
    addMember(planId, memberId);
    saveGmailConnection(ownerId, "manual-owner@example.com", GmailIntegrationProperties.GMAIL_SEND_SCOPE);
    String cardId = createCard(ownerToken, planId, "Avisar equipe", "", null);

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/inbox/send")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "recipientUserIds": ["%s"]
                }
                """.formatted(memberId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.sentTo[0]").value("manual-member@example.com"));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].cards[0].assignees[0].id").value(memberId));
  }

  @Test
  void shouldClearPersistedInboxDeliveries() throws Exception {
    JsonNode ownerSession = register("Clear Owner", "clear-owner@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode memberSession = register("Clear Member", "clear-member@example.com");
    String memberId = memberSession.path("user").path("id").asText();
    String planId = createPlan(ownerToken, "Plano Limpar Inbox").path("plan").path("id").asText();
    addMember(planId, memberId);
    saveGmailConnection(ownerId, "clear-owner@example.com", GmailIntegrationProperties.GMAIL_SEND_SCOPE);
    String cardId = createCard(ownerToken, planId, "Limpar historico", "", null);

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/inbox/send")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "recipientUserIds": ["%s"]
                }
                """.formatted(memberId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.inboxItem.cardId").value(cardId));

    mockMvc.perform(delete("/api/plans/" + planId + "/board/inbox/deliveries")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Historico da Inbox limpo com sucesso."));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.inboxItems.length()").value(0));
  }

  @Test
  void shouldOnlySendCardToManualRecipientsNotAlreadyAssigned() throws Exception {
    JsonNode ownerSession = register("Existing Owner", "existing-owner@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode assignedSession = register("Already Assigned", "already-assigned@example.com");
    String assignedId = assignedSession.path("user").path("id").asText();
    JsonNode newMemberSession = register("New Assignee", "new-assignee@example.com");
    String newMemberId = newMemberSession.path("user").path("id").asText();
    String planId = createPlan(ownerToken, "Plano Novos Destinatarios").path("plan").path("id").asText();
    addMember(planId, assignedId);
    addMember(planId, newMemberId);
    saveGmailConnection(ownerId, "existing-owner@example.com", GmailIntegrationProperties.GMAIL_SEND_SCOPE);
    String cardId = createCard(ownerToken, planId, "Avisar apenas novos", "", assignedId);

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/inbox/send")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "recipientUserIds": ["%s", "%s"]
                }
                """.formatted(assignedId, newMemberId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.sentTo.length()").value(1))
        .andExpect(jsonPath("$.data.sentTo[0]").value("new-assignee@example.com"));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].cards[0].assignees[*].id", hasItems(assignedId, newMemberId)));
  }

  @Test
  void shouldRejectManualRecipientOutsidePlan() throws Exception {
    JsonNode ownerSession = register("Invalid Owner", "invalid-owner@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    JsonNode outsiderSession = register("Outside User", "outside@example.com");
    String outsiderId = outsiderSession.path("user").path("id").asText();
    String planId = createPlan(ownerToken, "Plano Protegido").path("plan").path("id").asText();
    saveGmailConnection(ownerId, "invalid-owner@example.com", GmailIntegrationProperties.GMAIL_SEND_SCOPE);
    String cardId = createCard(ownerToken, planId, "Cartao restrito", "", null);

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/inbox/send")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "recipientUserIds": ["%s"]
                }
                """.formatted(outsiderId)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("DESTINATARIO_INVALIDO"));
  }

  @Test
  void shouldRejectCardInboxSendWithoutConnectedGmail() throws Exception {
    JsonNode ownerSession = register("Missing Gmail Owner", "missing-inbox-owner@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    String planId = createPlan(ownerToken, "Plano sem Gmail").path("plan").path("id").asText();
    String cardId = createCard(ownerToken, planId, "Sem Gmail", "", null);

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/inbox/send")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "recipientUserIds": ["%s"]
                }
                """.formatted(ownerId)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("GMAIL_NAO_CONECTADO"));
  }

  @Test
  void shouldRejectCardInboxSendWithoutGmailSendScope() throws Exception {
    JsonNode ownerSession = register("Scope Owner", "scope-inbox-owner@example.com");
    String ownerToken = ownerSession.path("accessToken").asText();
    String ownerId = ownerSession.path("user").path("id").asText();
    String planId = createPlan(ownerToken, "Plano sem escopo").path("plan").path("id").asText();
    saveGmailConnection(ownerId, "scope-inbox-owner@example.com", "openid email");
    String cardId = createCard(ownerToken, planId, "Sem escopo", "", null);

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/inbox/send")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "recipientUserIds": ["%s"]
                }
                """.formatted(ownerId)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("GMAIL_SCOPE_AUSENTE"));
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

  private void addMember(String planId, String userId) {
    PlanMemberEntity member = new PlanMemberEntity();
    member.setPlanId(UUID.fromString(planId));
    member.setUserId(UUID.fromString(userId));
    member.setRole(PlanMemberRole.MEMBER);
    planMemberRepository.save(member);
  }

  private String createCard(String token, String planId, String title, String description, String assigneeId) throws Exception {
    JsonNode board = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = board.path("columns").get(0).path("id").asText();
    String assigneesJson = assigneeId == null ? "" : "\"%s\"".formatted(assigneeId);
    return readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "%s",
                  "description": "%s",
                  "assigneeIds": [%s]
                }
                """.formatted(columnId, title, description, assigneesJson)))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();
  }

  private void saveGmailConnection(String userId, String email, String scopes) {
    GmailConnectionEntity connection = new GmailConnectionEntity();
    connection.setUserId(UUID.fromString(userId));
    connection.setEmail(email);
    connection.setScopes(scopes);
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

    String rawMessage;

    @Override
    public GmailAccessToken refreshAccessToken(com.planthings.api.auth.OAuthProperties.Provider config, String refreshToken) {
      return new GmailAccessToken("access-token", GmailIntegrationProperties.GMAIL_SEND_SCOPE);
    }

    @Override
    public GmailSendResponse sendMessage(String accessToken, String rawMessage) {
      this.rawMessage = rawMessage;
      return new GmailSendResponse("message-id", "thread-id");
    }

    String decodedRawMessage() {
      return new String(Base64.getUrlDecoder().decode(rawMessage), StandardCharsets.UTF_8);
    }

    void reset() {
      rawMessage = null;
    }
  }
}
