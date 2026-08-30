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

class BoardColumnGroupIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldCreateAndRenameColumnGroupStartingAtCardBelow() throws Exception {
    String token = registerAndGetToken("Owner", "owner-groups@example.com", "12345678");
    String planId = createPlan(token, "Plano agrupamentos").path("plan").path("id").asText();
    String columnId = createBoardColumn(token, planId, "Backlog");
    String firstCardId = createBoardCard(token, planId, columnId, "Cartao A");
    String secondCardId = createBoardCard(token, planId, columnId, "Cartao B");

    JsonNode created = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/columns/" + columnId + "/groups")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "startCardId": "%s",
                  "title": ""
                }
                """.formatted(secondCardId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].groups[0].startCardId").value(secondCardId))
        .andReturn()).path("data");

    String groupId = created.path("columns").get(0).path("groups").get(0).path("id").asText();

    mockMvc.perform(patch("/api/plans/" + planId + "/board/groups/" + groupId)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Sprint atual",
                  "collapsed": true
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].groups[0].title").value("Sprint atual"))
        .andExpect(jsonPath("$.data.columns[0].groups[0].collapsed").value(true));

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].groups[0].id").value(groupId))
        .andExpect(jsonPath("$.data.columns[0].groups[0].startCardId").value(secondCardId));

    mockMvc.perform(post("/api/plans/" + planId + "/board/columns/" + columnId + "/groups")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "startCardId": "%s"
                }
                """.formatted(firstCardId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].groups.length()").value(2));

    mockMvc.perform(delete("/api/plans/" + planId + "/board/cards/" + secondCardId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].cards.length()").value(1))
        .andExpect(jsonPath("$.data.columns[0].groups[0].startCardId").value(firstCardId));
  }

  @Test
  void shouldDeleteColumnGroupWithoutRemovingCards() throws Exception {
    String token = registerAndGetToken("Owner", "owner-groups-delete@example.com", "12345678");
    String planId = createPlan(token, "Plano agrupamentos delete").path("plan").path("id").asText();
    String columnId = createBoardColumn(token, planId, "Backlog");
    createBoardCard(token, planId, columnId, "Cartao A");
    String secondCardId = createBoardCard(token, planId, columnId, "Cartao B");

    JsonNode created = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/columns/" + columnId + "/groups")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "startCardId": "%s"
                }
                """.formatted(secondCardId)))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    String groupId = created.path("columns").get(0).path("groups").get(0).path("id").asText();

    mockMvc.perform(delete("/api/plans/" + planId + "/board/groups/" + groupId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.columns[0].groups.length()").value(0))
        .andExpect(jsonPath("$.data.columns[0].cards.length()").value(2));
  }

  private String createBoardCard(String token, String planId, String columnId, String title) throws Exception {
    return readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "%s"
                }
                """.formatted(columnId, title)))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();
  }
}
