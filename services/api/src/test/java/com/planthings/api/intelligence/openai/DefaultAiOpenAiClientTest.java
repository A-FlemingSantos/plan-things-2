package com.planthings.api.intelligence.openai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.intelligence.IntelligenceProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DefaultAiOpenAiClientTest {

  @Test
  void shouldReportConfiguredWhenEnabledWithApiKey() {
    IntelligenceProperties properties = new IntelligenceProperties();
    properties.setEnabled(true);
    properties.setApiKey("sk-test");

    DefaultAiOpenAiClient client = new DefaultAiOpenAiClient(
        org.springframework.web.client.RestClient.builder(),
        new ObjectMapper(),
        properties
    );

    assertTrue(client.isConfigured());
  }

  @Test
  void shouldExtractOutputTextFromResponsesPayload() throws Exception {
    IntelligenceProperties properties = new IntelligenceProperties();
    properties.setEnabled(true);
    properties.setApiKey("sk-test");

    DefaultAiOpenAiClient client = new DefaultAiOpenAiClient(
        org.springframework.web.client.RestClient.builder(),
        new ObjectMapper(),
        properties
    );

    var method = DefaultAiOpenAiClient.class.getDeclaredMethod("extractOutputText", com.fasterxml.jackson.databind.JsonNode.class);
    method.setAccessible(true);

    ObjectMapper mapper = new ObjectMapper();
    var output = mapper.readTree("""
        [
          {
            "type": "message",
            "content": [
              { "type": "output_text", "text": "Primeira linha." },
              { "type": "output_text", "text": "Segunda linha." }
            ]
          }
        ]
        """);

    String text = (String) method.invoke(client, output);
    assertEquals("Primeira linha.\nSegunda linha.", text);
  }

  @Test
  void shouldExtractCompactionOutputItems() throws Exception {
    IntelligenceProperties properties = new IntelligenceProperties();
    properties.setEnabled(true);
    properties.setApiKey("sk-test");

    DefaultAiOpenAiClient client = new DefaultAiOpenAiClient(
        org.springframework.web.client.RestClient.builder(),
        new ObjectMapper(),
        properties
    );

    var method = DefaultAiOpenAiClient.class.getDeclaredMethod("extractCompactionOutputItems", com.fasterxml.jackson.databind.JsonNode.class);
    method.setAccessible(true);

    ObjectMapper mapper = new ObjectMapper();
    var output = mapper.readTree("""
        [
          {
            "type": "compaction",
            "id": "cmp_123",
            "encrypted_content": "opaque"
          },
          {
            "type": "message",
            "content": [
              { "type": "output_text", "text": "Resposta." }
            ]
          }
        ]
        """);

    @SuppressWarnings("unchecked")
    java.util.List<String> items = (java.util.List<String>) method.invoke(client, output);
    assertEquals(1, items.size());
    assertTrue(items.get(0).contains("cmp_123"));
  }
}
