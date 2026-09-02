package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.plans.PlanInviteEmailSender;
import com.planthings.api.plans.PlanRepository;
import com.planthings.api.plans.PlanSlugService;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PlanSlugBackfillIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private DataSource dataSource;

  @Autowired
  private PlanRepository planRepository;

  @Test
  void shouldRewriteCompactUuidSlugFromNameAndKeepIdLookup() throws Exception {
    String token = registerAndGetToken("Dono Slug", "slug-backfill-owner@example.com", "12345678");
    JsonNode created = createPlan(token, "Quadro Antigo");
    UUID planId = UUID.fromString(created.path("plan").path("id").asText());
    String compactSlug = planId.toString().replace("-", "");

    forceCompactUuidSlug(planId);
    rewriteLegacySlugs();

    mockMvc.perform(patch("/api/plans/" + planId + "/visibility")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                { "visibility": "PUBLIC" }
                """))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/plans/quadro-antigo"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.slug").value("quadro-antigo"));

    mockMvc.perform(get("/api/plans/" + compactSlug))
        .andExpect(status().isNotFound());

    mockMvc.perform(get("/api/plans/" + planId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.slug").value("quadro-antigo"));
  }

  @Test
  void shouldSuffixCollidingLegacyNamesAndLeavePrettySlugsAlone() throws Exception {
    String token = registerAndGetToken("Dono Colisao", "slug-backfill-collision@example.com", "12345678");
    UUID firstId = UUID.fromString(createPlan(token, "Mesmo Nome").path("plan").path("id").asText());
    UUID secondId = UUID.fromString(createPlan(token, "Mesmo Nome").path("plan").path("id").asText());
    UUID prettyId = UUID.fromString(createPlan(token, "Quadro Novo").path("plan").path("id").asText());

    forceCompactUuidSlug(firstId);
    forceCompactUuidSlug(secondId);
    rewriteLegacySlugs();

    mockMvc.perform(get("/api/plans/" + firstId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.slug").value("mesmo-nome"));

    mockMvc.perform(get("/api/plans/" + secondId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.slug").value("mesmo-nome-2"));

    mockMvc.perform(get("/api/plans/" + prettyId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.plan.slug").value("quadro-novo"));
  }

  private void forceCompactUuidSlug(UUID planId) {
    var plan = planRepository.findById(planId).orElseThrow();
    plan.setSlug(planId.toString().replace("-", ""));
    planRepository.save(plan);
  }

  private void rewriteLegacySlugs() throws Exception {
    try (var connection = dataSource.getConnection()) {
      PlanSlugService.rewriteLegacyCompactSlugs(connection);
    }
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
