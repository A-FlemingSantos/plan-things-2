package com.planthings.api.intelligence;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiContextBuilderTest {

  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
  private final AiContextBuilder contextBuilder = new AiContextBuilder(new ObjectMapper(), validator);

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

  @Test
  void shouldRejectUnknownSnapshotFields() {
    assertThrows(
        com.planthings.api.common.error.BadRequestException.class,
        () -> contextBuilder.validateAndNormalize(java.util.Map.of(
            "contextChips",
            java.util.List.of(),
            "unexpectedField",
            "value"
        ))
    );
  }
}
