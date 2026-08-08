package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
}
