package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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

  @Test
  void shouldFavoriteAndUnfavoriteFiles() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-favs@example.com", "12345678");

    MockMultipartFile multipartFile = new MockMultipartFile(
        "file",
        "roteiro.txt",
        MediaType.TEXT_PLAIN_VALUE,
        "arquivo favorito".getBytes()
    );

    String fileId = readJson(mockMvc.perform(multipart("/api/files/upload")
            .file(multipartFile)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    mockMvc.perform(post("/api/files/" + fileId + "/favorite")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.starred").value(true));

    mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].starred").value(true));

    mockMvc.perform(post("/api/files/" + fileId + "/unfavorite")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.starred").value(false));

    mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].starred").value(false));
  }

  @Test
  void shouldDeleteAndRestoreFolderTreeRecursively() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-folder-tree@example.com", "12345678");

    String rootFolderId = readJson(mockMvc.perform(post("/api/files/folders")
            .header("Authorization", "Bearer " + token)
            .param("name", "Raiz"))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    String childFolderId = readJson(mockMvc.perform(post("/api/files/folders")
            .header("Authorization", "Bearer " + token)
            .param("name", "Filhos")
            .param("parentId", rootFolderId))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    MockMultipartFile nestedFile = new MockMultipartFile(
        "file",
        "escopo.txt",
        MediaType.TEXT_PLAIN_VALUE,
        "subarvore".getBytes()
    );

    String nestedFileId = readJson(mockMvc.perform(multipart("/api/files/upload")
            .file(nestedFile)
            .header("Authorization", "Bearer " + token)
            .param("parentId", childFolderId))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    mockMvc.perform(delete("/api/files/" + rootFolderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    JsonNode trashedItems = readJson(mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token)
            .param("trash", "true"))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    assertEquals(3, trashedItems.size());
    for (JsonNode item : trashedItems) {
      assertEquals(true, item.path("deleted").asBoolean());
    }

    mockMvc.perform(post("/api/files/" + rootFolderId + "/restore")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Arquivo restaurado com sucesso."));

    JsonNode activeItems = readJson(mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    JsonNode restoredRoot = null;
    JsonNode restoredChild = null;
    JsonNode restoredNestedFile = null;
    for (JsonNode item : activeItems) {
      String itemId = item.path("id").asText();
      if (rootFolderId.equals(itemId)) {
        restoredRoot = item;
      } else if (childFolderId.equals(itemId)) {
        restoredChild = item;
      } else if (nestedFileId.equals(itemId)) {
        restoredNestedFile = item;
      }
    }

    assertNotNull(restoredRoot);
    assertNotNull(restoredChild);
    assertNotNull(restoredNestedFile);
    assertEquals(rootFolderId, restoredChild.path("parentId").asText());
    assertEquals(childFolderId, restoredNestedFile.path("parentId").asText());
  }
}
