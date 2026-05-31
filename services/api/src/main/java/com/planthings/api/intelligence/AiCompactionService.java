package com.planthings.api.intelligence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.intelligence.persistence.AiCompactionItemEntity;
import com.planthings.api.intelligence.persistence.AiCompactionItemRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AiCompactionService {

  public static final String MODE_SERVER_SIDE = "SERVER_SIDE";
  public static final String MODE_THRESHOLD_AUDIT = "THRESHOLD_AUDIT";
  private static final String COMPACTION_OUTPUT_TYPE = "compaction";

  private final AiCompactionItemRepository compactionItemRepository;
  private final IntelligenceProperties properties;
  private final ObjectMapper objectMapper;

  public AiCompactionService(
      AiCompactionItemRepository compactionItemRepository,
      IntelligenceProperties properties,
      ObjectMapper objectMapper
  ) {
    this.compactionItemRepository = compactionItemRepository;
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  @Transactional(readOnly = true)
  public List<JsonNode> loadLatestCompactionInputItems(UUID conversationId) {
    return compactionItemRepository
        .findTopByConversationIdAndCompactionModeOrderByCreatedAtDesc(conversationId, MODE_SERVER_SIDE)
        .map(this::parseCompactionInputItems)
        .orElse(List.of());
  }

  @Transactional
  public void recordCompactionOutput(
      UUID conversationId,
      UUID messageId,
      String openaiResponseId,
      List<String> compactionOutputItemsJson,
      String tokenUsageJson
  ) {
    if (compactionOutputItemsJson == null || compactionOutputItemsJson.isEmpty()) {
      recordCompactionThresholdAudit(conversationId, messageId, openaiResponseId, tokenUsageJson);
      return;
    }

    int threshold = properties.getCompactThreshold();
    for (String itemJson : compactionOutputItemsJson) {
      if (!StringUtils.hasText(itemJson) || !isCompactionOutputItem(itemJson)) {
        continue;
      }

      AiCompactionItemEntity item = new AiCompactionItemEntity();
      item.setConversationId(conversationId);
      item.setMessageId(messageId);
      item.setOpenaiResponseId(openaiResponseId);
      item.setCompactionMode(MODE_SERVER_SIDE);
      item.setCompactThreshold(threshold > 0 ? threshold : null);
      item.setInputTokenEstimate(estimateInputTokens(tokenUsageJson));
      item.setOutputItemRef(extractOutputItemRef(itemJson));
      item.setOpaquePayloadJson(itemJson);
      compactionItemRepository.save(item);
    }
  }

  private List<JsonNode> parseCompactionInputItems(AiCompactionItemEntity entity) {
    if (!MODE_SERVER_SIDE.equals(entity.getCompactionMode())) {
      return List.of();
    }
    if (!StringUtils.hasText(entity.getOpaquePayloadJson())) {
      return List.of();
    }

    try {
      JsonNode item = objectMapper.readTree(entity.getOpaquePayloadJson());
      if (item != null && item.isObject() && isCompactionOutputNode(item)) {
        return List.of(item);
      }
    } catch (Exception ignored) {
      // Ignora payload corrompido; o proximo turno segue sem compaction local.
    }
    return List.of();
  }

  private void recordCompactionThresholdAudit(
      UUID conversationId,
      UUID messageId,
      String openaiResponseId,
      String tokenUsageJson
  ) {
    if (!StringUtils.hasText(tokenUsageJson)) {
      return;
    }

    try {
      JsonNode usage = objectMapper.readTree(tokenUsageJson);
      int inputTokens = usage.path("input_tokens").asInt(0);
      if (inputTokens <= 0) {
        inputTokens = usage.path("prompt_tokens").asInt(0);
      }

      int threshold = properties.getCompactThreshold();
      if (threshold <= 0 || inputTokens < threshold) {
        return;
      }

      AiCompactionItemEntity item = new AiCompactionItemEntity();
      item.setConversationId(conversationId);
      item.setMessageId(messageId);
      item.setOpenaiResponseId(openaiResponseId);
      item.setCompactionMode(MODE_THRESHOLD_AUDIT);
      item.setCompactThreshold(threshold);
      item.setInputTokenEstimate(inputTokens > 0 ? inputTokens : null);
      item.setOpaquePayloadJson(null);
      compactionItemRepository.save(item);
    } catch (Exception ignored) {
      // Metadados de compaction sao best-effort; nao devem falhar a resposta.
    }
  }

  private boolean isCompactionOutputItem(String itemJson) {
    try {
      JsonNode item = objectMapper.readTree(itemJson);
      return isCompactionOutputNode(item);
    } catch (Exception exception) {
      return false;
    }
  }

  private boolean isCompactionOutputNode(JsonNode item) {
    return item != null && item.isObject() && COMPACTION_OUTPUT_TYPE.equals(item.path("type").asText(""));
  }

  private Integer estimateInputTokens(String tokenUsageJson) {
    if (!StringUtils.hasText(tokenUsageJson)) {
      return null;
    }
    try {
      JsonNode usage = objectMapper.readTree(tokenUsageJson);
      int inputTokens = usage.path("input_tokens").asInt(0);
      if (inputTokens <= 0) {
        inputTokens = usage.path("prompt_tokens").asInt(0);
      }
      return inputTokens > 0 ? inputTokens : null;
    } catch (Exception exception) {
      return null;
    }
  }

  private String extractOutputItemRef(String itemJson) {
    try {
      JsonNode item = objectMapper.readTree(itemJson);
      String id = item.path("id").asText(null);
      return StringUtils.hasText(id) ? id : null;
    } catch (Exception exception) {
      return null;
    }
  }
}
