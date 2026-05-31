package com.planthings.api.intelligence.openai;

import java.util.List;

public record OpenAiResponseResult(
    String responseId,
    String outputText,
    String tokenUsageJson,
    List<String> compactionOutputItemsJson
) {

  public OpenAiResponseResult(String responseId, String outputText, String tokenUsageJson) {
    this(responseId, outputText, tokenUsageJson, List.of());
  }
}
