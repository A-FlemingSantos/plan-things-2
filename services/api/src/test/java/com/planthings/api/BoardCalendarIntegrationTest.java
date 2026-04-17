package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BoardCalendarIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldSyncCardsIntoCalendarWithBrazilianDateFormatting() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur@example.com", "12345678");
    JsonNode plan = createPlan(token, "Produto Q3");
    String planId = plan.path("plan").path("id").asText();
    String backlogColumnId = plan.path("plan").isMissingNode() ? "" : readJson(
        mockMvc.perform(get("/api/plans/" + planId + "/board").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn()
    ).path("data").path("columns").get(0).path("id").asText();

    JsonNode createdCard = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Definir data do release",
                  "description": "Card com prazo",
                  "dueAt": "2026-04-20T14:00:00-03:00"
                }
                """.formatted(backlogColumnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.kind").value("TAREFA"))
        .andExpect(jsonPath("$.data.dueAt.text").value("20/04/2026 14:00"))
        .andReturn()).path("data");

    String cardId = createdCard.path("id").asText();

    mockMvc.perform(get("/api/calendar/events")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].title").value("Definir data do release"))
        .andExpect(jsonPath("$.data[0].generatedFromCard").value(true))
        .andExpect(jsonPath("$.data[0].cardKind").value("TAREFA"));

    mockMvc.perform(patch("/api/plans/" + planId + "/board/cards/" + cardId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Definir data do release",
                  "description": "Card virou evento",
                  "startAt": "2026-04-20T13:00:00-03:00",
                  "dueAt": "2026-04-20T14:00:00-03:00"
                }
                """.formatted(backlogColumnId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.kind").value("EVENTO"))
        .andExpect(jsonPath("$.data.startAt.text").value("20/04/2026 13:00"));

    mockMvc.perform(get("/api/calendar/events")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].cardKind").value("EVENTO"))
        .andExpect(jsonPath("$.data[0].startsAt.text").value("20/04/2026 13:00"))
        .andExpect(jsonPath("$.data[0].endsAt.text").value("20/04/2026 14:00"));

    mockMvc.perform(delete("/api/plans/" + planId + "/board/cards/" + cardId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/calendar/events")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isEmpty());
  }
}
