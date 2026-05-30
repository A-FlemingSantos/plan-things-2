package com.planthings.api.intelligence.openai;

import java.util.function.Consumer;

public interface AiOpenAiClient {

  boolean isConfigured();

  OpenAiResponseResult createResponse(OpenAiResponseRequest request);

  default OpenAiResponseResult createResponseStream(
      OpenAiResponseRequest request,
      Consumer<String> onDelta
  ) {
    OpenAiResponseResult response = createResponse(request);
    if (onDelta != null) {
      String outputText = response.outputText();
      if (outputText != null && !outputText.isEmpty()) {
        onDelta.accept(outputText);
      }
    }
    return response;
  }
}
