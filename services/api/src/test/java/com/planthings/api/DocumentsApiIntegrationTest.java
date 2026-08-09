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

  @Test
  void shouldIncludeMemberAvatarUrlsOnDocumentDetails() throws Exception {
    String ownerToken = registerAndGetToken("Avatar Owner", "avatar-doc-owner@example.com", "password123");
    String memberToken = registerAndGetToken("Avatar Member", "avatar-doc-member@example.com", "password123");
    MockMultipartFile avatarFile = new MockMultipartFile(
        "file",
        "avatar.png",
        "image/png",
        new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}
    );

    mockMvc.perform(multipart("/api/settings/account/avatar")
            .file(avatarFile)
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.avatarUrl").value(org.hamcrest.Matchers.matchesPattern("/api/avatars/users/.+\\?v=.+")));

    String documentId = readJson(mockMvc.perform(post("/api/documents")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Documento com avatares",
                  "description": "",
                  "contentMarkdown": "# Avatares"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("document").path("id").asText();

    JsonNode invite = readJson(mockMvc.perform(post("/api/documents/" + documentId + "/invites")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "avatar-doc-member@example.com",
                  "role": "VIEWER"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    mockMvc.perform(post("/api/documents/invites/" + invite.path("token").asText() + "/accept")
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk());

    JsonNode members = readJson(mockMvc.perform(get("/api/documents/" + documentId)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isOk())
        .andReturn()).path("data").path("members");

    JsonNode ownerMember = null;
    JsonNode viewerMember = null;
    for (JsonNode member : members) {
      if ("avatar-doc-owner@example.com".equalsIgnoreCase(member.path("email").asText())) {
        ownerMember = member;
      }
      if ("avatar-doc-member@example.com".equalsIgnoreCase(member.path("email").asText())) {
        viewerMember = member;
      }
    }

    org.junit.jupiter.api.Assertions.assertNotNull(ownerMember);
    org.junit.jupiter.api.Assertions.assertNotNull(viewerMember);
    org.junit.jupiter.api.Assertions.assertTrue(
        ownerMember.path("avatarUrl").asText("").matches("/api/avatars/users/.+\\?v=.+")
    );
    org.junit.jupiter.api.Assertions.assertTrue(
        viewerMember.path("avatarUrl").isMissingNode() || viewerMember.path("avatarUrl").isNull()
    );
  }
}
