package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.plans.PlanMemberRepository;
import com.planthings.api.plans.PlanMemberRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BoardAssigneeIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private PlanMemberRepository planMemberRepository;

  @Test
  void shouldAllowAssigningMembersAndUpdatingDueDates() throws Exception {
    JsonNode session = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Arthur Santos",
                  "email": "arthur-assignee@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    String token = session.path("accessToken").asText();
    String userId = session.path("user").path("id").asText();

    JsonNode plan = createPlan(token, "Plano com responsaveis");
    String planId = plan.path("plan").path("id").asText();

    JsonNode board = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = createBoardColumn(token, planId, "Tarefas");

    JsonNode createdCard = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card com responsavel",
                  "assigneeIds": ["%s"]
                }
                """.formatted(columnId, userId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.assignees[0].id").value(userId))
        .andExpect(jsonPath("$.data.completed").value(false))
        .andReturn()).path("data");

    String cardId = createdCard.path("id").asText();

    mockMvc.perform(patch("/api/plans/" + planId + "/board/cards/" + cardId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card com responsavel",
                  "description": "Atualizando prazo com responsavel",
                  "assigneeIds": ["%s"],
                  "dueAt": "2026-04-21T14:00:00-03:00"
                }
                """.formatted(columnId, userId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.assignees[0].id").value(userId))
        .andExpect(jsonPath("$.data.dueAt.text").value("21/04/2026 14:00"));
  }

  @Test
  void shouldPersistCompletedStateWithoutMovingCardToDoneColumn() throws Exception {
    JsonNode session = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Arthur Completed",
                  "email": "arthur-completed@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    String token = session.path("accessToken").asText();

    JsonNode plan = createPlan(token, "Plano com conclusao persistida");
    String planId = plan.path("plan").path("id").asText();

    JsonNode board = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = createBoardColumn(token, planId, "Tarefas");

    JsonNode createdCard = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card concluivel"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.completed").value(false))
        .andReturn()).path("data");

    String cardId = createdCard.path("id").asText();

    mockMvc.perform(patch("/api/plans/" + planId + "/board/cards/" + cardId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card concluivel",
                  "completed": true
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columnId").value(columnId))
        .andExpect(jsonPath("$.data.completed").value(true));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].cards[0].id").value(cardId))
        .andExpect(jsonPath("$.data.columns[0].cards[0].columnId").value(columnId))
        .andExpect(jsonPath("$.data.columns[0].cards[0].completed").value(true));
  }

  @Test
  void shouldPersistStarredStateAcrossBoardReads() throws Exception {
    JsonNode session = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Arthur Starred",
                  "email": "arthur-starred@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    String token = session.path("accessToken").asText();

    JsonNode plan = createPlan(token, "Plano com estrela persistida");
    String planId = plan.path("plan").path("id").asText();
    String columnId = createBoardColumn(token, planId, "Tarefas");

    JsonNode createdCard = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card estrelavel",
                  "starred": true
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.starred").value(true))
        .andReturn()).path("data");

    String cardId = createdCard.path("id").asText();

    mockMvc.perform(patch("/api/plans/" + planId + "/board/cards/" + cardId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card estrelavel",
                  "starred": false
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.starred").value(false));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].cards[0].id").value(cardId))
        .andExpect(jsonPath("$.data.columns[0].cards[0].starred").value(false));
  }

  @Test
  void shouldRemoveLegacyCardAssignmentsWhenAMemberLeavesThePlan() throws Exception {
    JsonNode ownerSession = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Owner Cleanup",
                  "email": "owner-cleanup@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    JsonNode memberSession = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Member Cleanup",
                  "email": "member-cleanup@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    String ownerToken = ownerSession.path("accessToken").asText();
    String memberUserId = memberSession.path("user").path("id").asText();

    JsonNode plan = createPlan(ownerToken, "Plano com limpeza de responsaveis");
    String planId = plan.path("plan").path("id").asText();
    String columnId = createBoardColumn(ownerToken, planId, "Tarefas");

    PlanMemberEntity membership = new PlanMemberEntity();
    membership.setPlanId(java.util.UUID.fromString(planId));
    membership.setUserId(java.util.UUID.fromString(memberUserId));
    membership.setRole(PlanMemberRole.MEMBER);
    planMemberRepository.save(membership);

    JsonNode createdCard = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card com membro legado",
                  "assigneeIds": ["%s"]
                }
                """.formatted(columnId, memberUserId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.assignees[0].id").value(memberUserId))
        .andReturn()).path("data");

    mockMvc.perform(delete("/api/plans/" + planId + "/members/" + memberUserId)
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Membro removido com sucesso."));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].cards[0].id").value(createdCard.path("id").asText()))
        .andExpect(jsonPath("$.data.columns[0].cards[0].assignees").isEmpty());
  }
}


