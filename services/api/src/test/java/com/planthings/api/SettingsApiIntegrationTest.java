package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SettingsApiIntegrationTest extends ApiIntegrationTestSupport {
  private static final byte[] PNG_AVATAR = new byte[] {
      (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  };

  @Test
  void shouldLoadAndUpdateSettingsSnapshot() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-settings@example.com", "12345678");

    mockMvc.perform(get("/api/settings")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.account.localPasswordEnabled").value(true))
        .andExpect(jsonPath("$.data.account.externalIdentityLinked").value(false))
        .andExpect(jsonPath("$.data.preferences.theme").value("system"))
        .andExpect(jsonPath("$.data.preferences.dateFormat").value("dd/MM/yyyy"))
        .andExpect(jsonPath("$.data.preferences.timeFormat").value("24h"))
        .andExpect(jsonPath("$.data.notifications.emailNotifs").value(true))
        .andExpect(jsonPath("$.data.notifications.eventReminders").value(true))
        .andExpect(jsonPath("$.data.notifications.deadlineAlerts").value(true));

    mockMvc.perform(patch("/api/settings/preferences")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "locale": "en-US",
                  "timeZone": "America/New_York",
                  "theme": "dark",
                  "dateFormat": "MM/dd/yyyy",
                  "timeFormat": "12h"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.locale").value("en-US"))
        .andExpect(jsonPath("$.data.timeZone").value("America/New_York"))
        .andExpect(jsonPath("$.data.theme").value("dark"))
        .andExpect(jsonPath("$.data.dateFormat").value("MM/dd/yyyy"))
        .andExpect(jsonPath("$.data.timeFormat").value("12h"));

    mockMvc.perform(patch("/api/settings/notifications")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "emailNotifs": false,
                  "eventReminders": false,
                  "deadlineAlerts": true
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.emailNotifs").value(false))
        .andExpect(jsonPath("$.data.eventReminders").value(false))
        .andExpect(jsonPath("$.data.deadlineAlerts").value(true));

    mockMvc.perform(get("/api/settings")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.preferences.locale").value("en-US"))
        .andExpect(jsonPath("$.data.preferences.timeZone").value("America/New_York"))
        .andExpect(jsonPath("$.data.preferences.theme").value("dark"))
        .andExpect(jsonPath("$.data.preferences.dateFormat").value("MM/dd/yyyy"))
        .andExpect(jsonPath("$.data.preferences.timeFormat").value("12h"))
        .andExpect(jsonPath("$.data.notifications.emailNotifs").value(false))
        .andExpect(jsonPath("$.data.notifications.eventReminders").value(false))
        .andExpect(jsonPath("$.data.notifications.deadlineAlerts").value(true));
  }

  @Test
  void shouldRejectPasswordSetupForPasswordOnlyAccount() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-no-oauth@example.com", "12345678");

    mockMvc.perform(post("/api/settings/password/setup")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "newPassword": "87654321"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("CONTA_OAUTH_NAO_VINCULADA"));
  }

  @Test
  void shouldUpdateAccountWorkspaceAndPassword() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-account@example.com", "12345678");

    mockMvc.perform(patch("/api/settings/account")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Arthur Fleming"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.fullName").value("Arthur Fleming"));

    mockMvc.perform(patch("/api/workspace")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "name": "Workspace Produto"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.name").value("Workspace Produto"));

    mockMvc.perform(get("/api/me")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.user.fullName").value("Arthur Fleming"))
        .andExpect(jsonPath("$.data.workspace.name").value("Workspace Produto"));

    mockMvc.perform(patch("/api/settings/password")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "currentPassword": "12345678",
                  "newPassword": "87654321"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Senha atualizada com sucesso."));

    JsonNode login = readJson(mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "arthur-account@example.com",
                  "password": "87654321"
                }
                """))
        .andExpect(status().isOk())
        .andReturn());

    org.junit.jupiter.api.Assertions.assertFalse(login.path("data").path("accessToken").asText().isBlank());
  }

  @Test
  void shouldUploadServeAndRemoveAccountAvatar() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-avatar@example.com", "12345678");
    MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", PNG_AVATAR);

    MvcResult upload = mockMvc.perform(multipart("/api/settings/account/avatar")
            .file(file)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.avatarUrl").value(org.hamcrest.Matchers.matchesPattern("/api/avatars/users/.+\\?v=.+")))
        .andReturn();
    String avatarUrl = objectMapper.readTree(upload.getResponse().getContentAsString()).path("data").path("avatarUrl").asText();

    mockMvc.perform(get("/api/settings/account/avatar")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_PNG))
        .andExpect(content().bytes(PNG_AVATAR));

    mockMvc.perform(get(avatarUrl)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_PNG))
        .andExpect(content().bytes(PNG_AVATAR));

    mockMvc.perform(get("/api/me")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.user.avatarUrl").value(org.hamcrest.Matchers.matchesPattern("/api/avatars/users/.+\\?v=.+")));

    mockMvc.perform(delete("/api/settings/account/avatar")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.avatarUrl").doesNotExist());
  }

  @Test
  void shouldUploadServeAndRemoveWorkspaceAvatar() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-workspace-avatar@example.com", "12345678");
    MockMultipartFile file = new MockMultipartFile("file", "workspace.png", "image/png", PNG_AVATAR);

    mockMvc.perform(multipart("/api/workspace/avatar")
            .file(file)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.avatarUrl").value(org.hamcrest.Matchers.startsWith("/api/workspace/avatar?v=")));

    mockMvc.perform(get("/api/workspace/avatar")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_PNG))
        .andExpect(content().bytes(PNG_AVATAR));

    mockMvc.perform(get("/api/me")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.workspace.avatarUrl").value(org.hamcrest.Matchers.startsWith("/api/workspace/avatar?v=")));

    mockMvc.perform(delete("/api/workspace/avatar")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.avatarUrl").doesNotExist());
  }

  @Test
  void shouldRejectInvalidAvatarPayloads() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-invalid-avatar@example.com", "12345678");
    MockMultipartFile textFile = new MockMultipartFile("file", "avatar.txt", "text/plain", "hello".getBytes());
    MockMultipartFile mismatchedFile = new MockMultipartFile("file", "avatar.png", "image/png", "not-png".getBytes());

    mockMvc.perform(multipart("/api/settings/account/avatar")
            .file(textFile)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("AVATAR_TIPO_INVALIDO"));

    mockMvc.perform(multipart("/api/settings/account/avatar")
            .file(mismatchedFile)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("AVATAR_TIPO_INVALIDO"));
  }

  @Test
  void shouldRejectInvalidLocaleAndTimeZone() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-settings-invalid@example.com", "12345678");

    mockMvc.perform(patch("/api/settings/preferences")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "locale": "zz-INVALID",
                  "timeZone": "America/Sao_Paulo",
                  "dateFormat": "dd/MM/yyyy",
                  "timeFormat": "24h"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("IDIOMA_INVALIDO"));

    mockMvc.perform(patch("/api/settings/preferences")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "locale": "pt-BR",
                  "timeZone": "Mars/Olympus",
                  "dateFormat": "dd/MM/yyyy",
                  "timeFormat": "24h"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("FUSO_INVALIDO"));
  }

  @Test
  void shouldRejectInvalidThemeOnPreferencesUpdate() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-settings-theme-invalid@example.com", "12345678");

    mockMvc.perform(patch("/api/settings/preferences")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "locale": "pt-BR",
                  "timeZone": "America/Sao_Paulo",
                  "theme": "midnight-blue",
                  "dateFormat": "dd/MM/yyyy",
                  "timeFormat": "24h"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("TEMA_INVALIDO"));
  }

  @Test
  void shouldCanonicalizeLocaleAndTimeZoneOnPreferencesUpdate() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-settings-canonical@example.com", "12345678");

    mockMvc.perform(patch("/api/settings/preferences")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "locale": "pt_br",
                  "timeZone": "America/Sao_Paulo",
                  "dateFormat": "dd/MM/yyyy",
                  "timeFormat": "24h"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.locale").value("pt-BR"))
        .andExpect(jsonPath("$.data.timeZone").value("America/Sao_Paulo"));
  }
}
