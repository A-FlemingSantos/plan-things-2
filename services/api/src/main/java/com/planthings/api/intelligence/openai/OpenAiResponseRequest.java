package com.planthings.api.intelligence.openai;

import java.util.List;

public record OpenAiResponseRequest(
    String model,
    String reasoningEffort,
    int maxOutputTokens,
    boolean store,
    String previousResponseId,
    List<OpenAiInputMessage> input,
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
    this(model, reasoningEffort, maxOutputTokens, store, previousResponseId, input, null);
  }

  public record OpenAiInputMessage(
      String role,
      String content
  ) {
  }
}
