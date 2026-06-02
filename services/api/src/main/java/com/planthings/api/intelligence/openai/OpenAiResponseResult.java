package com.planthings.api.intelligence.openai;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record OpenAiResponseResult(
    String responseId,
    String outputText,
    String tokenUsageJson,
    List<String> compactionOutputItemsJson,
    List<JsonNode> outputItems
) {

  public OpenAiResponseResult(String responseId, String outputText, String tokenUsageJson) {
    this(responseId, outputText, tokenUsageJson, List.of(), List.of());
  }

  public OpenAiResponseResult(
      String responseId,
      String outputText,
      String tokenUsageJson,
      List<String> compactionOutputItemsJson
  ) {
    this(responseId, outputText, tokenUsageJson, compactionOutputItemsJson, List.of());
  }
}
