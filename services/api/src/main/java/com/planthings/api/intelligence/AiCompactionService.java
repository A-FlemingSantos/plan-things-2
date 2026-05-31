package com.planthings.api.intelligence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.intelligence.persistence.AiCompactionItemEntity;
import com.planthings.api.intelligence.persistence.AiCompactionItemRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AiCompactionService {

  public static final String MODE_SERVER_SIDE = "SERVER_SIDE";

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
    return compactionItemRepository.findTopByConversationIdOrderByCreatedAtDesc(conversationId)
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
      if (!StringUtils.hasText(itemJson)) {
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
    if (!StringUtils.hasText(entity.getOpaquePayloadJson())) {
      return List.of();
    }

    try {
      JsonNode item = objectMapper.readTree(entity.getOpaquePayloadJson());
      if (item != null && item.isObject()) {
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
      item.setCompactionMode(MODE_SERVER_SIDE);
      item.setCompactThreshold(threshold);
      item.setInputTokenEstimate(inputTokens > 0 ? inputTokens : null);
      item.setOpaquePayloadJson(tokenUsageJson);
      compactionItemRepository.save(item);
    } catch (Exception ignored) {
      // Metadados de compaction sao best-effort; nao devem falhar a resposta.
    }
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
