package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.plans.PlanMemberRepository;
import com.planthings.api.plans.PlanMemberRole;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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

  @Autowired
  private PlanMemberRepository planMemberRepository;

  @Autowired
  private UserRepository userRepository;

  @Test
  void shouldUploadShareTrashAndRestoreFiles() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur@example.com", "12345678");
    JsonNode plan = createPlan(token, "Plano com arquivos");
    String planId = plan.path("plan").path("id").asText();
    JsonNode board = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = createBoardColumn(token, planId, "Tarefas");
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
        .andExpect(jsonPath("$.data.id").isNotEmpty())
        .andExpect(jsonPath("$.data.fileId").value(fileId))
        .andExpect(jsonPath("$.data.name").value("briefing.txt"))
        .andExpect(jsonPath("$.data.canRemove").value(true));

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
  void shouldApplyPlanFileAttachmentPermissions() throws Exception {
    String ownerToken = registerAndGetToken("Owner", "owner-files@example.com", "12345678");
    JsonNode createdPlan = createPlan(ownerToken, "Plano com permissoes de arquivos");
    String planId = createdPlan.path("plan").path("id").asText();

    String memberToken = registerAndGetToken("Member", "member-files@example.com", "12345678");
    String memberId = userRepository.findByEmailIgnoreCase("member-files@example.com").orElseThrow().getId().toString();
    addMember(planId, memberId);

    JsonNode board = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = createBoardColumn(ownerToken, planId, "Tarefas");
    String cardId = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card colaborativo"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    String sharedOwnerFileId = uploadTextFile(ownerToken, "briefing-compartilhado.txt");
    mockMvc.perform(post("/api/files/" + sharedOwnerFileId + "/share/plans/" + planId)
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk());

    mockMvc.perform(post("/api/files/" + sharedOwnerFileId + "/attach/cards/" + cardId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk());

    String lockedOwnerFileId = uploadTextFile(ownerToken, "contrato-owner.txt");
    mockMvc.perform(post("/api/files/" + lockedOwnerFileId + "/attach/cards/" + cardId)
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk());

    JsonNode memberBoard = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String lockedOwnerAttachmentId = findAttachmentByFileId(memberBoard, lockedOwnerFileId).path("id").asText();

    mockMvc.perform(delete("/api/files/attachments/" + lockedOwnerAttachmentId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("REMOCAO_DO_ANEXO_NEGADA"));

    mockMvc.perform(delete("/api/files/attachments/" + lockedOwnerAttachmentId)
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk());

    String memberFileId = uploadTextFile(memberToken, "minuta-member.txt");
    mockMvc.perform(post("/api/files/" + memberFileId + "/attach/cards/" + cardId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/files/plans/" + planId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.id=='" + memberFileId + "')].name").value("minuta-member.txt"));

    mockMvc.perform(delete("/api/files/" + memberFileId + "/share/plans/" + planId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk());

    JsonNode boardWithoutMemberFile = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    assertAttachmentMissing(boardWithoutMemberFile, memberFileId);

    mockMvc.perform(get("/api/files/plans/" + planId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.id=='" + memberFileId + "')]").doesNotExist());

    String folderId = readJson(mockMvc.perform(post("/api/files/folders")
            .header("Authorization", "Bearer " + memberToken)
            .param("name", "Pasta nao anexavel"))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    mockMvc.perform(post("/api/files/" + folderId + "/attach/cards/" + cardId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("ANEXO_INVALIDO"));
  }

  @Test
  void shouldUploadAndAttachToCardAtomically() throws Exception {
    String token = registerAndGetToken("Upload Attach", "upload-attach@example.com", "12345678");
    JsonNode plan = createPlan(token, "Plano com upload atomico");
    String planId = plan.path("plan").path("id").asText();
    JsonNode board = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = createBoardColumn(token, planId, "Tarefas");
    String cardId = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card com upload atomico"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    MockMultipartFile multipartFile = new MockMultipartFile(
        "file",
        "anexo-atomico.txt",
        MediaType.TEXT_PLAIN_VALUE,
        "conteudo atomico".getBytes()
    );

    mockMvc.perform(multipart("/api/files/upload/attach/cards/" + cardId)
            .file(multipartFile)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.id").isNotEmpty())
        .andExpect(jsonPath("$.data.name").value("anexo-atomico.txt"))
        .andExpect(jsonPath("$.data.canRemove").value(true))
        .andExpect(jsonPath("$.data.attachedByCurrentUser").value(true));

    String fileId = readJson(mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.name=='anexo-atomico.txt')].name").value("anexo-atomico.txt"))
        .andReturn()).path("data").get(0).path("id").asText();

    mockMvc.perform(get("/api/files/plans/" + planId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.id=='" + fileId + "')].name").value("anexo-atomico.txt"));

    JsonNode boardWithAttachment = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    findAttachmentByFileId(boardWithAttachment, fileId);
  }

  @Test
  void shouldRollbackAtomicUploadWhenCardIsInvalidOrInaccessible() throws Exception {
    String token = registerAndGetToken("Atomic Owner", "atomic-owner@example.com", "12345678");
    JsonNode plan = createPlan(token, "Plano rollback atomico");
    String planId = plan.path("plan").path("id").asText();

    MockMultipartFile invalidCardUpload = new MockMultipartFile(
        "file",
        "falha-card-invalido.txt",
        MediaType.TEXT_PLAIN_VALUE,
        "falha".getBytes()
    );

    mockMvc.perform(multipart("/api/files/upload/attach/cards/" + java.util.UUID.randomUUID())
            .file(invalidCardUpload)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error.code").value("CARTAO_NAO_ENCONTRADO"));

    mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.name=='falha-card-invalido.txt')]").doesNotExist());

    mockMvc.perform(get("/api/files/plans/" + planId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.name=='falha-card-invalido.txt')]").doesNotExist());

    JsonNode ownerBoard = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String columnId = createBoardColumn(token, planId, "Tarefas");
    String cardId = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card protegido"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    String outsiderToken = registerAndGetToken("Atomic Outsider", "atomic-outsider@example.com", "12345678");
    MockMultipartFile forbiddenUpload = new MockMultipartFile(
        "file",
        "falha-sem-acesso.txt",
        MediaType.TEXT_PLAIN_VALUE,
        "falha".getBytes()
    );

    mockMvc.perform(multipart("/api/files/upload/attach/cards/" + cardId)
            .file(forbiddenUpload)
            .header("Authorization", "Bearer " + outsiderToken))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + outsiderToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.name=='falha-sem-acesso.txt')]").doesNotExist());

    mockMvc.perform(get("/api/files/plans/" + planId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.name=='falha-sem-acesso.txt')]").doesNotExist());
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

  @Test
  void shouldPermanentlyDeleteTrashedFolderTreeRecursively() throws Exception {
    String token = registerAndGetToken("Permanent Delete", "permanent-delete@example.com", "12345678");

    String rootFolderId = readJson(mockMvc.perform(post("/api/files/folders")
            .header("Authorization", "Bearer " + token)
            .param("name", "Raiz permanente"))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    String childFolderId = readJson(mockMvc.perform(post("/api/files/folders")
            .header("Authorization", "Bearer " + token)
            .param("name", "Filho permanente")
            .param("parentId", rootFolderId))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    MockMultipartFile nestedFile = new MockMultipartFile(
        "file",
        "permanente.txt",
        MediaType.TEXT_PLAIN_VALUE,
        "subarvore permanente".getBytes()
    );

    readJson(mockMvc.perform(multipart("/api/files/upload")
            .file(nestedFile)
            .header("Authorization", "Bearer " + token)
            .param("parentId", childFolderId))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    mockMvc.perform(delete("/api/files/" + rootFolderId + "/permanent")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("ARQUIVO_FORA_DA_LIXEIRA"));

    mockMvc.perform(delete("/api/files/" + rootFolderId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    mockMvc.perform(delete("/api/files/" + rootFolderId + "/permanent")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Arquivo excluido permanentemente com sucesso."));

    mockMvc.perform(get("/api/files")
            .header("Authorization", "Bearer " + token)
            .param("trash", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data").isEmpty());

    mockMvc.perform(post("/api/files/" + rootFolderId + "/restore")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error.code").value("ARQUIVO_NAO_ENCONTRADO"));
  }

  private String uploadTextFile(String token, String name) throws Exception {
    MockMultipartFile multipartFile = new MockMultipartFile(
        "file",
        name,
        MediaType.TEXT_PLAIN_VALUE,
        "conteudo".getBytes()
    );

    return readJson(mockMvc.perform(multipart("/api/files/upload")
            .file(multipartFile)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();
  }

  private void addMember(String planId, String userId) {
    PlanMemberEntity member = new PlanMemberEntity();
    member.setPlanId(UUID.fromString(planId));
    member.setUserId(UUID.fromString(userId));
    member.setRole(PlanMemberRole.MEMBER);
    planMemberRepository.save(member);
  }

  private JsonNode findAttachmentByFileId(JsonNode board, String fileId) {
    for (JsonNode column : board.path("columns")) {
      for (JsonNode card : column.path("cards")) {
        for (JsonNode attachment : card.path("attachments")) {
          if (fileId.equals(attachment.path("fileId").asText())) {
            return attachment;
          }
        }
      }
    }
    throw new AssertionError("Anexo nao encontrado para arquivo " + fileId);
  }

  private void assertAttachmentMissing(JsonNode board, String fileId) {
    for (JsonNode column : board.path("columns")) {
      for (JsonNode card : column.path("cards")) {
        for (JsonNode attachment : card.path("attachments")) {
          if (fileId.equals(attachment.path("fileId").asText())) {
            throw new AssertionError("Anexo ainda presente para arquivo " + fileId);
          }
        }
      }
    }
  }
}


