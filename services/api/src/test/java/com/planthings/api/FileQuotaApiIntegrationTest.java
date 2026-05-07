package com.planthings.api;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
    "app.storage.basic-bytes=10",
    "app.storage.professional-bytes=10",
    "app.storage.team-bytes=10",
})
class FileQuotaApiIntegrationTest extends ApiIntegrationTestSupport {

  @Test
  void shouldRejectUploadWhenStorageQuotaIsExceeded() throws Exception {
    String token = registerAndGetToken("Quota Test", "quota-test@example.com", "12345678");

    MockMultipartFile file = new MockMultipartFile(
        "file",
        "too-big.txt",
        MediaType.TEXT_PLAIN_VALUE,
        "x".repeat(11).getBytes()
    );

    mockMvc.perform(multipart("/api/files/upload")
            .file(file)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("STORAGE_QUOTA_EXCEEDED"));
  }
}

