package com.planthings.api.intelligence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AiContextBuilder {

  private final ObjectMapper objectMapper;

  public AiContextBuilder(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public String serializeSnapshot(Object contextSnapshot) {
    if (contextSnapshot == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(contextSnapshot);
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
