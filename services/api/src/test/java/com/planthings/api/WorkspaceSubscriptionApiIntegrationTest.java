package com.planthings.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
    "app.storage.basic-bytes=10",
    "app.storage.professional-bytes=100",
    "app.storage.team-bytes=200",
})
class WorkspaceSubscriptionApiIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldUpdateWorkspaceSubscriptionPlan() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-plan-update@example.com", "12345678");

    mockMvc.perform(patch("/api/workspace/subscription")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "subscriptionPlan": "PROFESSIONAL"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.subscriptionPlan").value("PROFESSIONAL"))
        .andExpect(jsonPath("$.data.storageQuotaBytes").value(100))
        .andExpect(jsonPath("$.data.storageUsedBytes").value(0));
  }

  @Test
  void shouldBlockDowngradeWhenUsageExceedsNewQuota() throws Exception {
    String token = registerAndGetToken("Arthur Santos", "arthur-plan-downgrade@example.com", "12345678");

    mockMvc.perform(patch("/api/workspace/subscription")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "subscriptionPlan": "PROFESSIONAL"
                }
                """))
        .andExpect(status().isOk());

    byte[] content = "x".repeat(50).getBytes();
    MockMultipartFile file = new MockMultipartFile("file", "big.txt", MediaType.TEXT_PLAIN_VALUE, content);

    mockMvc.perform(multipart("/api/files/upload")
            .file(file)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    mockMvc.perform(patch("/api/workspace/subscription")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "subscriptionPlan": "BASIC"
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("DOWNGRADE_BLOCKED_STORAGE_EXCEEDED"));
  }
}

