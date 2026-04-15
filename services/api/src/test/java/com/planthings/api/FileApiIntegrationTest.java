package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FileApiIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldUploadShareTrashAndRestoreFiles() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur@example.com", "12345678");
    JsonNode plan = createPlan(token, "Plano com arquivos");
    String planId = plan.path("plan").path("id").asText();
    JsonNode board = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = board.path("columns").get(0).path("id").asText();
    String cardId = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card com anexo"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    MockMultipartFile multipartFile = new MockMultipartFile(
        "file",
        "briefing.txt",
        MediaType.TEXT_PLAIN_VALUE,
        "conteudo de teste".getBytes()
    );

    JsonNode uploaded = readJson(mockMvc.perform(multipart("/api/files/upload")
            .file(multipartFile)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("briefing.txt"))
        .andReturn()).path("data");
    String fileId = uploaded.path("id").asText();

    mockMvc.perform(post("/api/files/" + fileId + "/share/plans/" + planId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Arquivo compartilhado com o plano com sucesso."));

    mockMvc.perform(post("/api/files/" + fileId + "/attach/cards/" + cardId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Arquivo anexado ao cartao com sucesso."));

    mockMvc.perform(get("/api/files/plans/" + planId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].name").value("briefing.txt"));

    mockMvc.perform(delete("/api/files/" + fileId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token)
            .param("trash", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].deleted").value(true));

    mockMvc.perform(post("/api/files/" + fileId + "/restore")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Arquivo restaurado com sucesso."));

    mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].name").value("briefing.txt"));
  }
}
