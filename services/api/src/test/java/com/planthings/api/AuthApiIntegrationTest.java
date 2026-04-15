package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.matchesPattern;
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
}
