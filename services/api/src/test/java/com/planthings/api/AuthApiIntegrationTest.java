package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthApiIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldRegisterWithBrazilianMessagesAndDateFormat() throws Exception {
    mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Arthur Santos",
                  "email": "arthur@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.user.fullName").value("Arthur Santos"))
        .andExpect(jsonPath("$.data.workspace.name").value("Workspace de Arthur Santos"))
        .andExpect(jsonPath("$.data.workspace.iconKey").value("BUILDING"))
        .andExpect(jsonPath("$.data.workspace.avatarUrl").doesNotExist())
        .andExpect(jsonPath("$.data.workspace.subscriptionPlan").value("BASIC"))
        .andExpect(jsonPath("$.data.workspace.storageUsedBytes").value(0))
        .andExpect(jsonPath("$.data.workspace.storageQuotaBytes").isNumber())
        .andExpect(jsonPath("$.data.user.createdAt.text", matchesPattern("\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2}")));
  }

  @Test
  void shouldReturnValidationErrorsInPortuguese() throws Exception {
    mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "",
                  "email": "",
                  "password": "123"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("VALIDACAO_INVALIDA"))
        .andExpect(jsonPath("$.error.message").value("Os dados enviados sao invalidos."));
  }

  @Test
  void shouldResetPasswordAndAllowLoginWithNewSecret() throws Exception {
    registerAndGetToken("Arthur Santos", "arthur@example.com", "12345678");

    JsonNode forgot = readJson(mockMvc.perform(post("/api/auth/forgot-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "arthur@example.com"
                }
                """))
        .andExpect(status().isOk())
        .andReturn());

    String resetToken = forgot.path("data").path("resetToken").asText();

    mockMvc.perform(post("/api/auth/reset-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "token": "%s",
                  "newPassword": "87654321"
                }
                """.formatted(resetToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.message").value("Senha redefinida com sucesso."));

    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "arthur@example.com",
                  "password": "87654321"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
  }

  @Test
  void shouldRefreshCurrentSessionWithoutCreatingAnotherSessionRecord() throws Exception {
    JsonNode register = readJson(mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "fullName": "Arthur Santos",
                  "email": "arthur-refresh@example.com",
                  "password": "12345678",
                  "client": "web"
                }
                """))
        .andExpect(status().isOk())
        .andReturn());

    String originalToken = register.path("data").path("accessToken").asText();

    JsonNode refresh = readJson(mockMvc.perform(post("/api/auth/refresh")
            .header("Authorization", "Bearer " + originalToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.user.email").value("arthur-refresh@example.com"))
        .andReturn());

    String refreshedToken = refresh.path("data").path("accessToken").asText();

    JsonNode sessions = readJson(mockMvc.perform(get("/api/settings/security/sessions")
            .header("Authorization", "Bearer " + refreshedToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(1))
        .andReturn());

    assertEquals(1, sessions.path("data").size());
    assertEquals("web", sessions.path("data").get(0).path("client").asText());
    assertEquals(true, sessions.path("data").get(0).path("current").asBoolean());
  }
}
