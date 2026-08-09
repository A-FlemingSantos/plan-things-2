package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DocumentsApiIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldPersistDocumentsCommentsAndVersionConflicts() throws Exception {
    String ownerToken = registerAndGetToken("Document Owner", "document-owner@example.com", "password123");
    String editorToken = registerAndGetToken("Document Editor", "document-editor@example.com", "password123");

    JsonNode created = readJson(mockMvc.perform(post("/api/documents")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Documento real",
                  "description": "Teste de persistência",
                  "contentMarkdown": "# Primeira versão"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.document.versionNumber").value(1))
        .andReturn()).path("data");
    String documentId = created.path("document").path("id").asText();

    JsonNode invite = readJson(mockMvc.perform(post("/api/documents/" + documentId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "document-editor@example.com",
                  "role": "EDITOR"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("PENDING"))
        .andReturn()).path("data");

    mockMvc.perform(post("/api/documents/invites/" + invite.path("token").asText() + "/accept")
            .header("Authorization", "Bearer " + editorToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.documentId").value(documentId));

    mockMvc.perform(patch("/api/documents/" + documentId)
            .header("Authorization", "Bearer " + editorToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Documento atualizado",
                  "description": "Teste de persistência",
                  "contentMarkdown": "## Segunda versão",
                  "expectedVersion": 1
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.document.versionNumber").value(2));

    mockMvc.perform(patch("/api/documents/" + documentId)
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Conflito",
                  "description": "",
                  "contentMarkdown": "Conteúdo antigo",
                  "expectedVersion": 1
                }
                """))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error.code").value("VERSAO_DESATUALIZADA"));

    mockMvc.perform(post("/api/documents/" + documentId + "/comments")
            .header("Authorization", "Bearer " + editorToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "body": "Comentário persistido",
                  "quotedText": "Segunda versão",
                  "selectionStart": 3,
                  "selectionEnd": 17
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.body").value("Comentário persistido"));

    mockMvc.perform(get("/api/documents/" + documentId + "/comments")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].quotedText").value("Segunda versão"));
  }

  @Test
  void shouldAllowDocumentMembersToDownloadCoverFile() throws Exception {
    String ownerToken = registerAndGetToken("Cover Owner", "cover-owner@example.com", "password123");
    String memberToken = registerAndGetToken("Cover Member", "cover-member@example.com", "password123");
    String strangerToken = registerAndGetToken("Cover Stranger", "cover-stranger@example.com", "password123");

    String documentId = readJson(mockMvc.perform(post("/api/documents")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Documento com capa",
                  "description": "",
                  "contentMarkdown": "# Capa"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("document").path("id").asText();

    MockMultipartFile coverFile = new MockMultipartFile(
        "file",
        "cover.png",
        MediaType.IMAGE_PNG_VALUE,
        new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47}
    );
    String fileId = readJson(mockMvc.perform(multipart("/api/files/upload")
            .file(coverFile)
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("id").asText();

    mockMvc.perform(patch("/api/documents/" + documentId)
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Documento com capa",
                  "description": "",
                  "contentMarkdown": "# Capa",
                  "coverImageId": "files/%s",
                  "expectedVersion": 1
                }
                """.formatted(fileId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.document.coverImageId").value("files/" + fileId));

    JsonNode invite = readJson(mockMvc.perform(post("/api/documents/" + documentId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "cover-member@example.com",
                  "role": "VIEWER"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    mockMvc.perform(post("/api/documents/invites/" + invite.path("token").asText() + "/accept")
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/files/" + fileId + "/download")
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andExpect(content().bytes(new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47}));

    mockMvc.perform(get("/api/files/" + fileId + "/download")
            .header("Authorization", "Bearer " + strangerToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("ACESSO_AO_ARQUIVO_NEGADO"));
  }
}
