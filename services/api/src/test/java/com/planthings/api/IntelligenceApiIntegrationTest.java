package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.intelligence.openai.AiOpenAiClient;
import com.planthings.api.intelligence.openai.OpenAiResponseRequest;
import com.planthings.api.intelligence.openai.OpenAiResponseResult;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
    "app.intelligence.enabled=true",
    "app.intelligence.api-key=test-openai-key"
})
class IntelligenceApiIntegrationTest extends ApiIntegrationTestSupport {

  @MockBean
  private AiOpenAiClient aiOpenAiClient;

  @Test
  void shouldRejectIntelligenceStatusWithoutAuthentication() throws Exception {
    mockMvc.perform(get("/api/intelligence/conversations/status"))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldCreateConversationAndAcceptMessage() throws Exception {
    when(aiOpenAiClient.createResponseStream(any(), any())).thenReturn(new OpenAiResponseResult(
        "resp_test_123",
        "Priorize os planos com maior risco e menor folga nesta semana.",
        "{\"total_tokens\":123}"
    ));

    String token = registerAndGetToken("Arthur Intelligence", "arthur-intelligence@example.com", "12345678");

    mockMvc.perform(get("/api/intelligence/conversations/status")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.enabled").value(true))
        .andExpect(jsonPath("$.data.configured").value(true))
        .andExpect(jsonPath("$.data.model").value("gpt-5.4-mini"));

    String conversationId = readJson(mockMvc.perform(post("/api/intelligence/conversations")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "scopeType": "WORKSPACE",
                  "title": "Ideias do workspace"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.scopeType").value("WORKSPACE"))
        .andExpect(jsonPath("$.data.status").value("ACTIVE"))
        .andReturn()).path("data").path("id").asText();

    mockMvc.perform(get("/api/intelligence/conversations/" + conversationId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.title").value("Ideias do workspace"));

    JsonNode acceptedMessage = postMessage(token, conversationId, "Quais planos devo priorizar esta semana?");

    JsonNode immediateMessages = readJson(mockMvc.perform(get("/api/intelligence/conversations/" + conversationId + "/messages")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    assertEquals(2, immediateMessages.size());
    assertEquals("USER", immediateMessages.path(0).path("role").asText());
    assertEquals("ASSISTANT", immediateMessages.path(1).path("role").asText());
    String immediateAssistantStatus = immediateMessages.path(1).path("status").asText();
    assertTrue(
        "PENDING".equals(immediateAssistantStatus)
            || "STREAMING".equals(immediateAssistantStatus)
            || "COMPLETED".equals(immediateAssistantStatus)
    );

    JsonNode settledAssistant = waitForMessageToSettle(
        token,
        conversationId,
        acceptedMessage.path("assistantMessageId").asText()
    );
    assertEquals("COMPLETED", settledAssistant.path("status").asText());
    assertEquals("resp_test_123", settledAssistant.path("openaiResponseId").asText());
    assertEquals(1, settledAssistant.path("blocks").size());
    assertEquals("MARKDOWN", settledAssistant.path("blocks").path(0).path("blockType").asText());
  }

  @Test
  void shouldKeepConversationStateAcrossMultipleMessagesWhenStoreIsDisabled() throws Exception {
    when(aiOpenAiClient.createResponseStream(any(), any()))
        .thenReturn(
            new OpenAiResponseResult("resp_first", "Primeira resposta.", "{\"total_tokens\":100}"),
            new OpenAiResponseResult("resp_second", "Segunda resposta.", "{\"total_tokens\":120}")
        );

    String token = registerAndGetToken("Arthur Conversa", "arthur-conversa@example.com", "12345678");
    String conversationId = readJson(mockMvc.perform(post("/api/intelligence/conversations")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "scopeType": "WORKSPACE",
                  "title": "Conversa multi-turno"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    JsonNode firstAccepted = postMessage(token, conversationId, "Primeira pergunta?");
    JsonNode firstAssistant = waitForMessageToSettle(
        token,
        conversationId,
        firstAccepted.path("assistantMessageId").asText()
    );
    JsonNode secondAccepted = postMessage(token, conversationId, "Segunda pergunta?");

    JsonNode secondAssistant = waitForMessageToSettle(
        token,
        conversationId,
        secondAccepted.path("assistantMessageId").asText()
    );

    assertEquals("COMPLETED", firstAssistant.path("status").asText());
    assertEquals("COMPLETED", secondAssistant.path("status").asText());
    assertEquals("Primeira resposta.", firstAssistant.path("contentText").asText());
    assertEquals("Segunda resposta.", secondAssistant.path("contentText").asText());

    ArgumentCaptor<OpenAiResponseRequest> requestCaptor = ArgumentCaptor.forClass(OpenAiResponseRequest.class);
    verify(aiOpenAiClient, org.mockito.Mockito.times(2)).createResponseStream(requestCaptor.capture(), any());
    List<OpenAiResponseRequest> requests = requestCaptor.getAllValues();

    assertEquals(2, requests.size());
    assertNull(requests.get(0).previousResponseId());
    assertNull(requests.get(1).previousResponseId());
    assertTrue(requests.get(1).input().stream().anyMatch(item ->
        "user".equals(item.role()) && item.content().contains("Primeira pergunta?")
    ));
    assertTrue(requests.get(1).input().stream().anyMatch(item ->
        "assistant".equals(item.role()) && item.content().contains("Primeira resposta.")
    ));
    assertTrue(requests.get(1).input().stream().anyMatch(item ->
        "user".equals(item.role()) && item.content().contains("Segunda pergunta?")
    ));
  }

  @Test
  void shouldPersistContextSnapshotAndListConversations() throws Exception {
    when(aiOpenAiClient.createResponseStream(any(), any())).thenReturn(new OpenAiResponseResult(
        "resp_ctx_1",
        "Entendi o contexto anexado.",
        "{\"total_tokens\":80}"
    ));

    String token = registerAndGetToken("Arthur Snapshot", "arthur-snapshot@example.com", "12345678");

    String conversationId = readJson(mockMvc.perform(post("/api/intelligence/conversations")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "scopeType": "WORKSPACE",
                  "title": "Com contexto"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    JsonNode accepted = readJson(mockMvc.perform(post("/api/intelligence/conversations/" + conversationId + "/messages")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "content": "Analise o plano anexado",
                  "contextSnapshot": {
                    "version": 1,
                    "contextChips": [
                      { "id": "chip-1", "kind": "plan", "label": "Marketing", "type": "plan" }
                    ],
                    "imageAttachments": [],
                    "fileAttachments": []
                  }
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    waitForMessageToSettle(token, conversationId, accepted.path("assistantMessageId").asText());

    JsonNode messages = readJson(mockMvc.perform(get("/api/intelligence/conversations/" + conversationId + "/messages")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    assertEquals("Marketing", messages.path(0).path("contextSnapshot").path("contextChips").path(0).path("label").asText());

    mockMvc.perform(get("/api/intelligence/conversations")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].id").value(conversationId))
        .andExpect(jsonPath("$.data[0].title").value("Com contexto"));

    mockMvc.perform(patch("/api/intelligence/conversations/" + conversationId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Contexto revisado",
                  "status": "ARCHIVED"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.title").value("Contexto revisado"))
        .andExpect(jsonPath("$.data.status").value("ARCHIVED"));
  }

  @Test
  void shouldCancelPendingAssistantMessage() throws Exception {
    when(aiOpenAiClient.createResponseStream(any(), any())).thenAnswer(invocation -> {
      Thread.sleep(2_000);
      return new OpenAiResponseResult("resp_slow", "Resposta tardia.", "{\"total_tokens\":10}");
    });

    String token = registerAndGetToken("Arthur Cancel", "arthur-cancel@example.com", "12345678");
    String conversationId = readJson(mockMvc.perform(post("/api/intelligence/conversations")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                { "scopeType": "WORKSPACE", "title": "Cancelar" }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    JsonNode accepted = postMessage(token, conversationId, "Gere uma resposta longa");

    mockMvc.perform(post("/api/intelligence/conversations/" + conversationId + "/messages/"
            + accepted.path("assistantMessageId").asText() + "/cancel")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("CANCELLED"));
  }

  @Test
  void shouldPersistEntityReferenceBlocksFromContextSnapshot() throws Exception {
    when(aiOpenAiClient.createResponseStream(any(), any())).thenReturn(new OpenAiResponseResult(
        "resp_refs_1",
        "Analisei o plano anexado.",
        "{\"total_tokens\":90}"
    ));

    String token = registerAndGetToken("Arthur Blocks", "arthur-blocks@example.com", "12345678");
    String planId = createPlan(token, "Plano com contexto").path("plan").path("id").asText();

    String conversationId = readJson(mockMvc.perform(post("/api/intelligence/conversations")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "scopeType": "WORKSPACE",
                  "title": "Referencias"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    JsonNode accepted = readJson(mockMvc.perform(post("/api/intelligence/conversations/" + conversationId + "/messages")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "content": "Resuma o plano",
                  "contextSnapshot": {
                    "version": 1,
                    "contextChips": [
                      { "id": "chip-1", "kind": "plan", "type": "plan-%s", "label": "Plano com contexto" }
                    ],
                    "imageAttachments": [],
                    "fileAttachments": []
                  }
                }
                """.formatted(planId)))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    JsonNode assistant = waitForMessageToSettle(
        token,
        conversationId,
        accepted.path("assistantMessageId").asText()
    );

    assertEquals("COMPLETED", assistant.path("status").asText());
    assertTrue(assistant.path("blocks").size() >= 2);

    boolean hasMarkdown = false;
    boolean hasPlanReference = false;
    for (JsonNode block : assistant.path("blocks")) {
      String blockType = block.path("blockType").asText();
      if ("MARKDOWN".equals(blockType)) {
        hasMarkdown = true;
      }
      if ("PLAN_REFERENCE".equals(blockType)) {
        hasPlanReference = true;
        assertEquals("/workspace/board/" + planId, block.path("href").asText());
        assertEquals("Plano com contexto", block.path("title").asText());
      }
    }

    assertTrue(hasMarkdown);
    assertTrue(hasPlanReference);
  }

  @Test
  void shouldValidateCardScopeWhenCreatingConversation() throws Exception {
    String token = registerAndGetToken("Arthur Card Intelligence", "arthur-card-intelligence@example.com", "12345678");
    String planId = createPlan(token, "Plano da conversa").path("plan").path("id").asText();
    String otherPlanId = createPlan(token, "Plano do cartao").path("plan").path("id").asText();
    String cardId = createCard(token, otherPlanId, "Cartao de outro plano");

    mockMvc.perform(post("/api/intelligence/conversations")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "planId": "%s",
                  "cardId": "%s",
                  "scopeType": "CARD",
                  "title": "Escopo invalido"
                }
                """.formatted(planId, cardId)))
        .andExpect(status().isNotFound());

    mockMvc.perform(post("/api/intelligence/conversations")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "cardId": "%s",
                  "title": "Escopo do cartao"
                }
                """.formatted(cardId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.planId").value(otherPlanId))
        .andExpect(jsonPath("$.data.cardId").value(cardId))
        .andExpect(jsonPath("$.data.scopeType").value("CARD"));
  }

  private String createCard(String token, String planId, String title) throws Exception {
    String columnId = createBoardColumn(token, planId, "Tarefas");
    return readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "%s",
                  "description": "Card de teste"
                }
                """.formatted(columnId, title)))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();
  }

  private JsonNode postMessage(String token, String conversationId, String content) throws Exception {
    return readJson(mockMvc.perform(post("/api/intelligence/conversations/" + conversationId + "/messages")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "content": "%s"
                }
                """.formatted(content)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.conversationId").value(conversationId))
        .andExpect(jsonPath("$.data.assistantStatus").value("PENDING"))
        .andReturn()).path("data");
  }

  private JsonNode waitForMessageToSettle(String token, String conversationId, String messageId) throws Exception {
    for (int attempt = 0; attempt < 40; attempt += 1) {
      JsonNode data = readJson(mockMvc.perform(get("/api/intelligence/conversations/" + conversationId + "/messages")
              .header("Authorization", "Bearer " + token))
          .andExpect(status().isOk())
          .andReturn()).path("data");

      if (data.isArray()) {
        for (JsonNode item : data) {
          if (!messageId.equals(item.path("id").asText())) {
            continue;
          }
          String status = item.path("status").asText();
          if ("COMPLETED".equals(status) || "FAILED".equals(status)) {
            return item;
          }
        }
      }

      Thread.sleep(100);
    }

    throw new AssertionError("A resposta da mensagem " + messageId + " nao concluiu dentro do tempo esperado.");
  }
}
