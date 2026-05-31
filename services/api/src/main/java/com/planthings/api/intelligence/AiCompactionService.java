package com.planthings.api.intelligence;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.intelligence.persistence.AiCompactionItemEntity;
import com.planthings.api.intelligence.persistence.AiCompactionItemRepository;
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

  @Transactional
  public void recordCompactionIfPresent(
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
}
