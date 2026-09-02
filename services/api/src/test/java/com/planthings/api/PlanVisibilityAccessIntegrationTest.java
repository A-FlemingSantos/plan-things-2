package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.plans.PlanInviteEmailSender;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PlanVisibilityAccessIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldCreatePrivatePlanWithSlugAndAdminCreator() throws Exception {
    String token = registerAndGetToken("Criador", "creator-plan@example.com", "12345678");
    JsonNode created = createPlan(token, "Meu Plano Publico");

    mockMvc.perform(get("/api/plans/" + created.path("plan").path("id").asText())
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.role").value("ADMIN"))
        .andExpect(jsonPath("$.data.plan.isCreator").value(true))
        .andExpect(jsonPath("$.data.plan.visibility").value("PRIVATE"))
        .andExpect(jsonPath("$.data.plan.slug").value("meu-plano-publico"))
        .andExpect(jsonPath("$.data.members[0].role").value("ADMIN"))
        .andExpect(jsonPath("$.data.members[0].isCreator").value(true));
  }

  @Test
  void shouldAllowAnonymousReadOnPublicPlanAndRejectPrivatePlan() throws Exception {
    String token = registerAndGetToken("Dono Publico", "public-owner@example.com", "12345678");
    JsonNode created = createPlan(token, "Quadro Aberto");
    String planId = created.path("plan").path("id").asText();
    String slug = created.path("plan").path("slug").asText();

    mockMvc.perform(get("/api/plans/" + slug))
        .andExpect(status().isUnauthorized());

    mockMvc.perform(patch("/api/plans/" + planId + "/visibility")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                { "visibility": "PUBLIC" }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.visibility").value("PUBLIC"));

    mockMvc.perform(get("/api/plans/" + slug))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.name").value("Quadro Aberto"))
        .andExpect(jsonPath("$.data.plan.role").value(nullValue()))
        .andExpect(jsonPath("$.data.members[0].email").value(nullValue()));

    mockMvc.perform(get("/api/plans/" + planId + "/board"))
        .andExpect(status().isOk());

    mockMvc.perform(post("/api/plans/" + planId + "/board/columns")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                { "title": "Hack" }
                """))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void shouldCreateShareLinkWithRoleAndAcceptMembership() throws Exception {
    String ownerToken = registerAndGetToken("Admin Link", "admin-link@example.com", "12345678");
    JsonNode created = createPlan(ownerToken, "Plano convite link");
    String planId = created.path("plan").path("id").asText();

    JsonNode shareLink = readJson(mockMvc.perform(put("/api/plans/" + planId + "/share-link")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                { "role": "OBSERVER" }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.role").value("OBSERVER"))
        .andReturn()).path("data");

    String joinToken = shareLink.path("token").asText();
    String memberToken = registerAndGetToken("Observador", "observer-join@example.com", "12345678");

    mockMvc.perform(post("/api/plans/share-links/" + joinToken + "/accept")
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.planId").value(planId));

    mockMvc.perform(get("/api/plans/" + planId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.role").value("OBSERVER"))
        .andExpect(jsonPath("$.data.plan.isCreator").value(false));
  }

  @Test
  void shouldPersistEmailInviteWithRoleEvenWithoutGmailWhenUsingFakeSender() throws Exception {
    String token = registerAndGetToken("Admin Invite", "admin-role-invite@example.com", "12345678");
    JsonNode created = createPlan(token, "Plano cargo");
    String planId = created.path("plan").path("id").asText();

    JsonNode invite = readJson(mockMvc.perform(post("/api/plans/" + planId + "/invites")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "novo-admin@example.com",
                  "role": "ADMIN"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.role").value("ADMIN"))
        .andReturn()).path("data");

    String inviteeToken = registerAndGetToken("Novo Admin", "novo-admin@example.com", "12345678");
    mockMvc.perform(post("/api/plans/invites/" + invite.path("token").asText() + "/accept")
            .header("Authorization", "Bearer " + inviteeToken))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/plans/" + planId)
            .header("Authorization", "Bearer " + inviteeToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.role").value("ADMIN"));
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
