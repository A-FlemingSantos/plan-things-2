package com.planthings.api.intelligence.openai;

public interface AiOpenAiClient {

  boolean isConfigured();

  OpenAiResponseResult createResponse(OpenAiResponseRequest request);
}
