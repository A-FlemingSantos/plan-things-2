package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.UUID;

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
}
