package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PlanApiIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private WorkspaceRepository workspaceRepository;

  @Test
  void shouldCreatePlanEvenWhenPersonalWorkspaceIsMissing() throws Exception {
    JsonNode session = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Arthur Santos",
                  "email": "arthur-plan@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn());

    String token = session.path("data").path("accessToken").asText();
    UUID userId = UUID.fromString(session.path("data").path("user").path("id").asText());

    workspaceRepository.findByOwnerUserId(userId).ifPresent(workspaceRepository::delete);

    mockMvc.perform(post("/api/plans")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Plano resiliente",
                  "description": "Criado apos autocorrecao da workspace"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.name").value("Plano resiliente"))
        .andExpect(jsonPath("$.data.members[0].email").value("arthur-plan@example.com"));
  }

  @Test
  void shouldExposeTaskCountInPlanSummaryList() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-plan-summary@example.com", "12345678");
    JsonNode createdPlan = createPlan(token, "Plano com contagem");
    String planId = createdPlan.path("plan").path("id").asText();

    JsonNode board = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = board.path("columns").get(0).path("id").asText();

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card 1"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk());

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card 2"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk());

    JsonNode list = readJson(mockMvc.perform(get("/api/plans")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    JsonNode summary = null;
    for (JsonNode item : list) {
      if (planId.equals(item.path("id").asText())) {
        summary = item;
        break;
      }
    }

    assertNotNull(summary);
    assertEquals(2, summary.path("taskCount").asInt());
  }
}
