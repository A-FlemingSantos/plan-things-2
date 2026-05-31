package com.planthings.api.intelligence.openai;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record OpenAiResponseRequest(
    String model,
    String reasoningEffort,
    int maxOutputTokens,
    boolean store,
    String previousResponseId,
    List<OpenAiInputMessage> input,
    List<JsonNode> rawInputItems,
    Integer compactThreshold
) {

  public OpenAiResponseRequest(
      String model,
      String reasoningEffort,
      int maxOutputTokens,
      boolean store,
      String previousResponseId,
      List<OpenAiInputMessage> input
  ) {
    this(model, reasoningEffort, maxOutputTokens, store, previousResponseId, input, List.of(), null);
  }

  public OpenAiResponseRequest(
      String model,
      String reasoningEffort,
      int maxOutputTokens,
      boolean store,
      String previousResponseId,
      List<OpenAiInputMessage> input,
      Integer compactThreshold
  ) {
    this(model, reasoningEffort, maxOutputTokens, store, previousResponseId, input, List.of(), compactThreshold);
  }

  public record OpenAiInputMessage(
      String role,
      String content
  ) {
  }
}
