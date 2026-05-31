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

  @Test
  void shouldRejectChipIconInContextChips() {
    assertThrows(
        com.planthings.api.common.error.BadRequestException.class,
        () -> contextBuilder.validateAndNormalize(java.util.Map.of(
            "contextChips",
            java.util.List.of(java.util.Map.of(
                "id",
                "chip-1",
                "kind",
                "plan",
                "label",
                "Marketing",
                "ChipIcon",
                "not-serializable"
            ))
        ))
    );
  }

  @Test
  void shouldAcceptFrontendGeneratedAttachmentType() {
    String generatedType = "file-upload-product-screenshot-png-image-png-348921-1780252705803";

    contextBuilder.validateAndNormalize(java.util.Map.of(
        "version",
        1,
        "contextChips",
        java.util.List.of(),
        "imageAttachments",
        java.util.List.of(java.util.Map.of(
            "id",
            "ctx-" + generatedType,
            "kind",
            "file",
            "type",
            generatedType,
            "label",
            "product-screenshot.png",
            "isImage",
            true,
            "previewUrl",
            "",
            "mimeType",
            "image/png",
            "fileId",
            "1b3896ff-1e55-4c15-b942-7ff5b3934352",
            "isMock",
            false
        )),
        "fileAttachments",
        java.util.List.of()
    ));
  }
}
