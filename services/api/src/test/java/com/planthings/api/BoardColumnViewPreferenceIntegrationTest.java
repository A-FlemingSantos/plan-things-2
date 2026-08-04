package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.plans.PlanMemberRepository;
import com.planthings.api.plans.PlanMemberRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BoardColumnViewPreferenceIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private PlanMemberRepository planMemberRepository;

  @Test
  void shouldPersistCompactColumnsPerUserAndPlan() throws Exception {
    String ownerToken = registerAndGetToken("Owner", "owner-compact@example.com", "12345678");
    JsonNode memberSession = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Member",
                  "email": "member-compact@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String memberToken = memberSession.path("accessToken").asText();
    String memberUserId = memberSession.path("user").path("id").asText();
    String planId = createPlan(ownerToken, "Plano compacto").path("plan").path("id").asText();
    String compactColumnId = createBoardColumn(ownerToken, planId, "Backlog");
    String expandedColumnId = createBoardColumn(ownerToken, planId, "Em andamento");

    PlanMemberEntity membership = new PlanMemberEntity();
    membership.setPlanId(java.util.UUID.fromString(planId));
    membership.setUserId(java.util.UUID.fromString(memberUserId));
    membership.setRole(PlanMemberRole.MEMBER);
    planMemberRepository.save(membership);

    mockMvc.perform(put("/api/plans/" + planId + "/board/preferences/compact-columns")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnIds": ["%s"]
                }
                """.formatted(compactColumnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columnIds[0]").value(compactColumnId));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.compactColumnIds[0]").value(compactColumnId));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.compactColumnIds").isEmpty());

    mockMvc.perform(put("/api/plans/" + planId + "/board/preferences/compact-columns")
            .header("Authorization", "Bearer " + memberToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnIds": ["%s"]
                }
                """.formatted(expandedColumnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columnIds[0]").value(expandedColumnId));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.compactColumnIds[0]").value(compactColumnId));
  }

  @Test
  void shouldRejectColumnsFromAnotherPlan() throws Exception {
    String token = registerAndGetToken("Arthur", "arthur-compact@example.com", "12345678");
    String firstPlanId = createPlan(token, "Primeiro plano").path("plan").path("id").asText();
    String secondPlanId = createPlan(token, "Segundo plano").path("plan").path("id").asText();
    String firstColumnId = createBoardColumn(token, firstPlanId, "Primeira lista");
    String secondColumnId = createBoardColumn(token, secondPlanId, "Segunda lista");

    mockMvc.perform(put("/api/plans/" + firstPlanId + "/board/preferences/compact-columns")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnIds": ["%s"]
                }
                """.formatted(firstColumnId)))
        .andExpect(status().isOk());

    mockMvc.perform(put("/api/plans/" + firstPlanId + "/board/preferences/compact-columns")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnIds": ["%s"]
                }
                """.formatted(secondColumnId)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("COLUNA_INVALIDA"));

    mockMvc.perform(get("/api/plans/" + firstPlanId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.compactColumnIds[0]").value(firstColumnId));
  }
}
