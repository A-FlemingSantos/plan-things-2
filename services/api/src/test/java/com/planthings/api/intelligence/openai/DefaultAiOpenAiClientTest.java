package com.planthings.api.intelligence.openai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.intelligence.IntelligenceProperties;
import org.junit.jupiter.api.Test;

import java.util.List;

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

  @Test
  void shouldSerializeToolsAndTrailingInputItemsIntoResponsesBody() throws Exception {
    IntelligenceProperties properties = new IntelligenceProperties();
    properties.setEnabled(true);
    properties.setApiKey("sk-test");

    DefaultAiOpenAiClient client = new DefaultAiOpenAiClient(
        org.springframework.web.client.RestClient.builder(),
        new ObjectMapper(),
        properties
    );

    var method = DefaultAiOpenAiClient.class.getDeclaredMethod("buildRequestBody", OpenAiResponseRequest.class, boolean.class);
    method.setAccessible(true);

    ObjectMapper mapper = new ObjectMapper();
    OpenAiResponseRequest request = new OpenAiResponseRequest(
        "gpt-5.4-mini",
        "low",
        6000,
        false,
        null,
        List.of(new OpenAiResponseRequest.OpenAiInputMessage("user", "buscar contexto")),
        List.of(mapper.readTree("""
            {"type":"compaction","id":"cmp_123"}
            """)),
        List.of(mapper.readTree("""
            {"type":"function_call_output","call_id":"call_1","output":"{}"}
            """)),
        null,
        List.of(mapper.readTree("""
            {"type":"function","name":"context.search","strict":true,"parameters":{"type":"object"}}
            """))
    );

    com.fasterxml.jackson.databind.node.ObjectNode body =
        (com.fasterxml.jackson.databind.node.ObjectNode) method.invoke(client, request, true);

    assertTrue(body.path("stream").asBoolean());
    assertEquals(3, body.path("input").size());
    assertEquals("compaction", body.path("input").path(0).path("type").asText());
    assertEquals("message", body.path("input").path(1).path("type").asText());
    assertEquals("function_call_output", body.path("input").path(2).path("type").asText());
    assertEquals("context.search", body.path("tools").path(0).path("name").asText());
  }
}
