package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.plans.PlanInviteEmailSender;
import com.planthings.api.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
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

  @Test
  void shouldAllowManagersToListAndRevokeInvitesAndAllowInviteAcceptanceToJoinPlans() throws Exception {
    String ownerToken = registerAndGetToken("Owner", "owner-invite@example.com", "12345678");
    JsonNode createdPlan = createPlan(ownerToken, "Plano com convites");
    String planId = createdPlan.path("plan").path("id").asText();

    JsonNode invite = readJson(mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "invitee@example.com"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.status").value("PENDING"))
        .andReturn()).path("data");

    String inviteToken = invite.path("token").asText();
    String inviteId = invite.path("inviteId").asText();

    mockMvc.perform(get("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data[0].inviteId").value(inviteId))
        .andExpect(jsonPath("$.data[0].token").value(inviteToken));

    String inviteeToken = registerAndGetToken("Invitee", "invitee@example.com", "12345678");

    mockMvc.perform(get("/api/plans/invites/pending")
            .header("Authorization", "Bearer " + inviteeToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data[0].token").value(inviteToken))
        .andExpect(jsonPath("$.data[0].planName").value("Plano com convites"))
        .andExpect(jsonPath("$.data[0].status").value("PENDING"));

    mockMvc.perform(get("/api/plans/invites/" + inviteToken)
            .header("Authorization", "Bearer " + inviteeToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.planId").value(planId))
        .andExpect(jsonPath("$.data.planName").value("Plano com convites"))
        .andExpect(jsonPath("$.data.invitedEmail").value("invitee@example.com"));

    mockMvc.perform(post("/api/plans/invites/" + inviteToken + "/accept")
            .header("Authorization", "Bearer " + inviteeToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.planId").value(planId))
        .andExpect(jsonPath("$.data.message").value("Convite aceito com sucesso."));

    JsonNode list = readJson(mockMvc.perform(get("/api/plans")
            .header("Authorization", "Bearer " + inviteeToken))
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

    mockMvc.perform(get("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + inviteeToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("GESTAO_DO_PLANO_NEGADA"));

    JsonNode declinedInvite = readJson(mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "declined@example.com"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    String declinedToken = declinedInvite.path("token").asText();
    String declinedUserToken = registerAndGetToken("Declined", "declined@example.com", "12345678");

    mockMvc.perform(post("/api/plans/invites/" + declinedToken + "/decline")
            .header("Authorization", "Bearer " + declinedUserToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Convite recusado com sucesso."));

    mockMvc.perform(get("/api/plans/invites/pending")
            .header("Authorization", "Bearer " + declinedUserToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isEmpty());

    JsonNode revokedInvite = readJson(mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "revoked@example.com"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    String revokedInviteId = revokedInvite.path("inviteId").asText();
    String revokedToken = revokedInvite.path("token").asText();

    mockMvc.perform(post("/api/plans/" + planId + "/invites/" + revokedInviteId + "/revoke")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Convite revogado com sucesso."));

    String revokedUserToken = registerAndGetToken("Revoked", "revoked@example.com", "12345678");

    mockMvc.perform(post("/api/plans/invites/" + revokedToken + "/accept")
            .header("Authorization", "Bearer " + revokedUserToken))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("CONVITE_INVALIDO"));
  }

  @TestConfiguration
  static class FakeInviteEmailConfig {

    @Bean
    @Primary
    PlanInviteEmailSender fakePlanInviteEmailSender() {
      return (inviter, invitedEmail, planName, inviteUrl, expiresAt) ->
          new PlanInviteEmailSender.Delivery(true, invitedEmail, inviter.getEmail());
    }
  }
}
