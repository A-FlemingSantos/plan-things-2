package com.planthings.api.intelligence.openai;

public record OpenAiResponseResult(
    String responseId,
    String outputText,
    String tokenUsageJson
) {
}
