package com.planthings.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
    "app.intelligence.enabled=true",
    "app.intelligence.api-key=test-openai-key"
})
class IntelligenceApiIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldRejectIntelligenceStatusWithoutAuthentication() throws Exception {
    mockMvc.perform(get("/api/intelligence/conversations/status"))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldCreateConversationAndAcceptMessage() throws Exception {
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

    mockMvc.perform(post("/api/intelligence/conversations/" + conversationId + "/messages")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "content": "Quais planos devo priorizar esta semana?"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.conversationId").value(conversationId))
        .andExpect(jsonPath("$.data.assistantStatus").value("PENDING"));

    mockMvc.perform(get("/api/intelligence/conversations/" + conversationId + "/messages")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(2))
        .andExpect(jsonPath("$.data[0].role").value("USER"))
        .andExpect(jsonPath("$.data[1].role").value("ASSISTANT"))
        .andExpect(jsonPath("$.data[1].status").value("PENDING"));
  }
}
