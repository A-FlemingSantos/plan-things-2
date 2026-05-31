package com.planthings.api.intelligence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.common.error.BadRequestException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AiContextBuilder {

  public static final int CONTEXT_SNAPSHOT_VERSION = 1;
  public static final int MAX_CONTEXT_JSON_LENGTH = 64_000;
  public static final int MAX_CONTEXT_CHIPS = 32;
  public static final int MAX_ATTACHMENTS = 16;
  public static final int MAX_LABEL_LENGTH = 200;

  private static final Set<String> ALLOWED_ROOT_FIELDS = Set.of(
      "version",
      "contextChips",
      "imageAttachments",
      "fileAttachments"
  );

  private static final Set<String> ALLOWED_CHIP_FIELDS = Set.of("id", "type", "kind", "label", "ChipIcon");
  private static final Set<String> ALLOWED_ATTACHMENT_FIELDS = Set.of(
      "id",
      "type",
      "kind",
      "label",
      "isImage",
      "previewUrl",
      "mimeType",
      "fileId",
      "isMock"
  );

  private final ObjectMapper objectMapper;
  private final Validator validator;

  public AiContextBuilder(ObjectMapper objectMapper, Validator validator) {
    this.objectMapper = objectMapper;
    this.validator = validator;
  }

  public AiContextSnapshotPayload validateAndNormalize(Object contextSnapshot) {
    if (contextSnapshot == null) {
      return null;
    }

    JsonNode root = objectMapper.valueToTree(contextSnapshot);
    if (root == null || root.isNull() || root.isMissingNode()) {
      return null;
    }
    if (!root.isObject()) {
      throw invalidSnapshot("O contextSnapshot deve ser um objeto JSON.");
    }

    rejectUnknownFields(root, ALLOWED_ROOT_FIELDS, "contextSnapshot");

    String serialized = root.toString();
    if (serialized.length() > MAX_CONTEXT_JSON_LENGTH) {
      throw invalidSnapshot("O contextSnapshot excede o tamanho maximo permitido.");
    }

    AiContextSnapshotPayload payload = objectMapper.convertValue(root, AiContextSnapshotPayload.class);
    Set<ConstraintViolation<AiContextSnapshotPayload>> violations = validator.validate(payload);
    if (!violations.isEmpty()) {
      throw invalidSnapshot(violations.iterator().next().getMessage());
    }

    if (payload.version() != null && payload.version() != CONTEXT_SNAPSHOT_VERSION) {
      throw invalidSnapshot("Versao de contextSnapshot nao suportada.");
    }

    validateAttachmentLists(root);
    return payload;
  }

  public String serializeSnapshot(Object contextSnapshot) {
    AiContextSnapshotPayload payload = validateAndNormalize(contextSnapshot);
    if (payload == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (Exception exception) {
      throw new IllegalArgumentException("Nao foi possivel serializar o contextSnapshot.", exception);
    }
  }

  public JsonNode parseSnapshotJson(String contextJson) {
    if (!StringUtils.hasText(contextJson)) {
      return null;
    }
    try {
      return objectMapper.readTree(contextJson);
    } catch (Exception exception) {
      return null;
    }
  }

  public Object deserializeSnapshotForApi(String contextJson) {
    JsonNode node = parseSnapshotJson(contextJson);
    if (node == null || node.isMissingNode() || node.isNull()) {
      return null;
    }
    return objectMapper.convertValue(node, Object.class);
  }

  public int estimateTokenCount(String contextJson) {
    if (!StringUtils.hasText(contextJson)) {
      return 0;
    }
    return Math.max(1, contextJson.length() / 4);
  }

  public String formatSnapshotForPrompt(JsonNode snapshot) {
    if (snapshot == null || snapshot.isMissingNode() || snapshot.isNull()) {
      return "";
    }

    List<String> lines = new ArrayList<>();
    appendChipLines(lines, "Chips de contexto", snapshot.path("contextChips"));
    appendAttachmentLines(lines, "Imagens anexadas", snapshot.path("imageAttachments"), true);
    appendAttachmentLines(lines, "Arquivos anexados", snapshot.path("fileAttachments"), false);

    if (lines.isEmpty()) {
      return "";
    }

    return String.join("\n", lines);
  }

  private void validateAttachmentLists(JsonNode root) {
    validateArrayItems(root.path("contextChips"), ALLOWED_CHIP_FIELDS, MAX_CONTEXT_CHIPS, "contextChips");
    validateArrayItems(root.path("imageAttachments"), ALLOWED_ATTACHMENT_FIELDS, MAX_ATTACHMENTS, "imageAttachments");
    validateArrayItems(root.path("fileAttachments"), ALLOWED_ATTACHMENT_FIELDS, MAX_ATTACHMENTS, "fileAttachments");
  }

  private void validateArrayItems(JsonNode arrayNode, Set<String> allowedFields, int maxItems, String fieldName) {
    if (arrayNode == null || arrayNode.isMissingNode() || arrayNode.isNull()) {
      return;
    }
    if (!arrayNode.isArray()) {
      throw invalidSnapshot(fieldName + " deve ser uma lista.");
    }
    if (arrayNode.size() > maxItems) {
      throw invalidSnapshot(fieldName + " excede o limite de " + maxItems + " itens.");
    }
    for (JsonNode item : arrayNode) {
      if (!item.isObject()) {
        throw invalidSnapshot("Itens de " + fieldName + " devem ser objetos.");
      }
      rejectUnknownFields(item, allowedFields, fieldName);
    }
  }

  private void rejectUnknownFields(JsonNode node, Set<String> allowedFields, String scope) {
    Iterator<String> fieldNames = node.fieldNames();
    while (fieldNames.hasNext()) {
      String fieldName = fieldNames.next();
      if (!allowedFields.contains(fieldName)) {
        throw invalidSnapshot("Campo nao permitido em " + scope + ": " + fieldName);
      }
    }
  }

  private BadRequestException invalidSnapshot(String message) {
    return new BadRequestException("CONTEXT_SNAPSHOT_INVALIDO", message);
  }

  private void appendChipLines(List<String> lines, String heading, JsonNode chips) {
    if (chips == null || !chips.isArray() || chips.isEmpty()) {
      return;
    }

    lines.add(heading + ":");
    for (JsonNode chip : chips) {
      String kind = chip.path("kind").asText("");
      String label = chip.path("label").asText("");
      String id = chip.path("id").asText("");
      if (!StringUtils.hasText(label)) {
        continue;
      }
      StringBuilder line = new StringBuilder("- ").append(label);
      if (StringUtils.hasText(kind)) {
        line.append(" (").append(kind).append(')');
      }
      if (StringUtils.hasText(id)) {
        line.append(" [").append(id).append(']');
      }
      lines.add(line.toString());
    }
  }

  private void appendAttachmentLines(List<String> lines, String heading, JsonNode attachments, boolean images) {
    if (attachments == null || !attachments.isArray() || attachments.isEmpty()) {
      return;
    }

    lines.add(heading + ":");
    for (JsonNode attachment : attachments) {
      String label = attachment.path("label").asText("");
      if (!StringUtils.hasText(label)) {
        continue;
      }
      String fileId = attachment.path("fileId").asText("");
      String mimeType = attachment.path("mimeType").asText("");
      StringBuilder line = new StringBuilder("- ").append(label);
      if (images) {
        line.append(" (imagem)");
      }
      if (StringUtils.hasText(fileId)) {
        line.append(" fileId=").append(fileId);
      }
      if (StringUtils.hasText(mimeType)) {
        line.append(" mime=").append(mimeType);
      }
      lines.add(line.toString());
    }
  }
}
