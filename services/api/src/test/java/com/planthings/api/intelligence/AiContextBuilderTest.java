package com.planthings.api.intelligence;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AiContextBuilderTest {

  private final AiContextBuilder contextBuilder = new AiContextBuilder(new ObjectMapper());

  @Test
  void shouldFormatSnapshotForPrompt() {
    String contextJson = """
        {
          "version": 1,
          "contextChips": [
            { "id": "chip-1", "kind": "plan", "label": "Marketing" }
          ],
          "imageAttachments": [
            { "label": "wireframe.png", "fileId": "file-uuid", "mimeType": "image/png" }
          ],
          "fileAttachments": []
        }
        """;

    String prompt = contextBuilder.formatSnapshotForPrompt(contextBuilder.parseSnapshotJson(contextJson));

    assertTrue(prompt.contains("Marketing"));
    assertTrue(prompt.contains("wireframe.png"));
    assertTrue(prompt.contains("fileId=file-uuid"));
  }
}
