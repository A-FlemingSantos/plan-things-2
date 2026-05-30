package com.planthings.api.intelligence.openai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.intelligence.IntelligenceProperties;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class DefaultAiOpenAiClient implements AiOpenAiClient {

  private static final Logger logger = LoggerFactory.getLogger(DefaultAiOpenAiClient.class);
  private static final String RESPONSES_URL = "https://api.openai.com/v1/responses";
  private static final String SSE_DONE_MARKER = "[DONE]";

  private final RestClient restClient;
  private final HttpClient streamingHttpClient;
  private final ObjectMapper objectMapper;
  private final IntelligenceProperties properties;

  public DefaultAiOpenAiClient(
      RestClient.Builder restClientBuilder,
      ObjectMapper objectMapper,
      IntelligenceProperties properties
  ) {
    this.restClient = restClientBuilder.build();
    this.streamingHttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .build();
    this.objectMapper = objectMapper;
    this.properties = properties;
  }

  @Override
  public boolean isConfigured() {
    return properties.isConfigured();
  }

  @Override
  public OpenAiResponseResult createResponse(OpenAiResponseRequest request) {
    ObjectNode body = buildRequestBody(request, false);
    return createNonStreamingResponse(body);
  }

  @Override
  public OpenAiResponseResult createResponseStream(
      OpenAiResponseRequest request,
      Consumer<String> onDelta
  ) {
    ObjectNode body = buildRequestBody(request, true);
    return createStreamingResponse(body, onDelta);
  }

  private ObjectNode buildRequestBody(OpenAiResponseRequest request, boolean stream) {
    if (!isConfigured()) {
      throw new BadRequestException(
          "INTELLIGENCE_NAO_CONFIGURADA",
          "A integracao com a OpenAI nao esta configurada."
      );
    }

    ObjectNode body = objectMapper.createObjectNode();
    body.put("model", request.model());
    body.put("store", request.store());
    body.put("max_output_tokens", request.maxOutputTokens());
    if (stream) {
      body.put("stream", true);
    }

    ObjectNode reasoning = body.putObject("reasoning");
    reasoning.put("effort", request.reasoningEffort());

    ArrayNode input = body.putArray("input");
    for (OpenAiResponseRequest.OpenAiInputMessage message : request.input()) {
      ObjectNode item = input.addObject();
      item.put("role", message.role());
      item.put("content", message.content());
    }

    if (StringUtils.hasText(request.previousResponseId())) {
      body.put("previous_response_id", request.previousResponseId());
    }

    return body;
  }

  private OpenAiResponseResult createNonStreamingResponse(ObjectNode body) {
    try {
      JsonNode response = restClient.post()
          .uri(RESPONSES_URL)
          .contentType(MediaType.APPLICATION_JSON)
          .header("Authorization", "Bearer " + properties.getApiKey())
          .body(body)
          .retrieve()
          .body(JsonNode.class);

      if (response == null) {
        throw new BadRequestException("OPENAI_RESPOSTA_VAZIA", "A OpenAI retornou uma resposta vazia.");
      }

      return new OpenAiResponseResult(
          response.path("id").asText(null),
          extractOutputText(response.path("output")),
          response.path("usage").isMissingNode() ? null : response.path("usage").toString()
      );
    } catch (RestClientResponseException exception) {
      logger.warn("Falha ao chamar OpenAI Responses API: status={} body={}", exception.getStatusCode(), exception.getResponseBodyAsString());
      throw new BadRequestException(
          "OPENAI_FALHA",
          "Nao foi possivel obter resposta da OpenAI agora."
      );
    }
  }

  private OpenAiResponseResult createStreamingResponse(ObjectNode body, Consumer<String> onDelta) {
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(RESPONSES_URL))
        .timeout(Duration.ofMinutes(2))
        .header("Authorization", "Bearer " + properties.getApiKey())
        .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .header("Accept", MediaType.TEXT_EVENT_STREAM_VALUE)
        .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
        .build();

    try {
      HttpResponse<InputStream> response = streamingHttpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
      int statusCode = response.statusCode();
      if (statusCode < 200 || statusCode >= 300) {
        String responseBody = readFully(response.body());
        logger.warn("Falha ao chamar OpenAI Responses API em streaming: status={} body={}", statusCode, responseBody);
        throw new BadRequestException("OPENAI_FALHA", "Nao foi possivel obter resposta da OpenAI agora.");
      }

      StreamAccumulator accumulator = new StreamAccumulator();
      consumeSseStream(response.body(), accumulator, onDelta);

      String outputText = accumulator.finalOutputText();
      if (!StringUtils.hasText(outputText)) {
        throw new BadRequestException("OPENAI_RESPOSTA_VAZIA", "A OpenAI retornou uma resposta vazia.");
      }

      return new OpenAiResponseResult(
          accumulator.responseId(),
          outputText,
          accumulator.tokenUsageJson()
      );
    } catch (IOException exception) {
      logger.warn("Falha de IO ao consumir OpenAI Responses API em streaming", exception);
      throw new BadRequestException("OPENAI_FALHA", "Nao foi possivel obter resposta da OpenAI agora.");
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new BadRequestException("OPENAI_FALHA", "Nao foi possivel obter resposta da OpenAI agora.");
    }
  }

  private void consumeSseStream(
      InputStream stream,
      StreamAccumulator accumulator,
      Consumer<String> onDelta
  ) throws IOException {
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
      String eventName = null;
      StringBuilder dataBuilder = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) {
        if (line.isEmpty()) {
          processSseEvent(eventName, dataBuilder.toString(), accumulator, onDelta);
          eventName = null;
          dataBuilder.setLength(0);
          continue;
        }

        if (line.startsWith("event:")) {
          eventName = line.substring("event:".length()).trim();
          continue;
        }

        if (line.startsWith("data:")) {
          if (dataBuilder.length() > 0) {
            dataBuilder.append('\n');
          }
          dataBuilder.append(line.substring("data:".length()).trim());
        }
      }

      processSseEvent(eventName, dataBuilder.toString(), accumulator, onDelta);
    }
  }

  private void processSseEvent(
      String eventName,
      String rawData,
      StreamAccumulator accumulator,
      Consumer<String> onDelta
  ) {
    String payloadText = String.valueOf(rawData == null ? "" : rawData).trim();
    if (!StringUtils.hasText(payloadText) || SSE_DONE_MARKER.equals(payloadText)) {
      return;
    }

    try {
      JsonNode payload = objectMapper.readTree(payloadText);
      String eventType = resolveEventType(eventName, payload);
      accumulator.captureMetadata(payload, eventType);

      String delta = extractDelta(payload, eventType);
      if (delta != null && !delta.isEmpty()) {
        accumulator.appendDelta(delta);
        if (onDelta != null) {
          onDelta.accept(delta);
        }
      }
    } catch (Exception exception) {
      logger.debug("Falha ao processar chunk SSE da OpenAI: event={} payload={}", eventName, payloadText, exception);
    }
  }

  private String resolveEventType(String eventName, JsonNode payload) {
    if (StringUtils.hasText(eventName)) {
      return eventName;
    }

    String payloadType = payload.path("type").asText("");
    if (StringUtils.hasText(payloadType)) {
      return payloadType;
    }
    return "message";
  }

  private String extractDelta(JsonNode payload, String eventType) {
    if (payload == null || payload.isMissingNode()) {
      return "";
    }

    String directDelta = payload.path("delta").asText("");
    if (directDelta != null && !directDelta.isEmpty()) {
      return directDelta;
    }

    if (eventType.contains("output_text.delta")) {
      return payload.path("text").asText("");
    }

    JsonNode itemDelta = payload.path("item").path("delta");
    if (!itemDelta.isMissingNode()) {
      return itemDelta.asText("");
    }

    return "";
  }

  private String readFully(InputStream inputStream) throws IOException {
    if (inputStream == null) {
      return "";
    }
    try (InputStream stream = inputStream) {
      return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
    }
  }

  private String extractOutputText(JsonNode outputNode) {
    if (outputNode == null || !outputNode.isArray()) {
      return "";
    }

    List<String> chunks = new ArrayList<>();
    for (JsonNode item : outputNode) {
      JsonNode content = item.path("content");
      if (!content.isArray()) {
        continue;
      }
      for (JsonNode part : content) {
        String type = part.path("type").asText("");
        if ("output_text".equals(type) || "text".equals(type)) {
          String text = part.path("text").asText("");
          if (StringUtils.hasText(text)) {
            chunks.add(text);
          }
        }
      }
    }
    return String.join("\n", chunks).trim();
  }

  private final class StreamAccumulator {
    private final StringBuilder outputBuilder = new StringBuilder();
    private JsonNode completedResponse;
    private String responseId;
    private String tokenUsageJson;

    void appendDelta(String delta) {
      outputBuilder.append(delta);
    }

    void captureMetadata(JsonNode payload, String eventType) {
      JsonNode responseNode = payload.path("response");
      JsonNode candidateNode = responseNode.isObject() ? responseNode : payload;

      if ("response.completed".equals(eventType) && candidateNode.isObject()) {
        completedResponse = candidateNode;
      }

      if (!StringUtils.hasText(responseId)) {
        String nestedResponseId = responseNode.path("id").asText(null);
        String rootResponseId = payload.path("id").asText(null);
        String responseIdFromEvent = payload.path("response_id").asText(null);
        responseId = firstNonBlank(nestedResponseId, responseIdFromEvent, rootResponseId);
      }

      if (!StringUtils.hasText(tokenUsageJson)) {
        JsonNode nestedUsage = responseNode.path("usage");
        JsonNode rootUsage = payload.path("usage");
        if (!nestedUsage.isMissingNode() && !nestedUsage.isNull()) {
          tokenUsageJson = nestedUsage.toString();
        } else if (!rootUsage.isMissingNode() && !rootUsage.isNull()) {
          tokenUsageJson = rootUsage.toString();
        }
      }
    }

    String responseId() {
      return responseId;
    }

    String tokenUsageJson() {
      return tokenUsageJson;
    }

    String finalOutputText() {
      if (outputBuilder.length() > 0) {
        return outputBuilder.toString().trim();
      }
      if (completedResponse != null && completedResponse.isObject()) {
        return extractOutputText(completedResponse.path("output"));
      }
      return "";
    }

    private String firstNonBlank(String... values) {
      for (String value : values) {
        if (StringUtils.hasText(value)) {
          return value;
        }
      }
      return null;
    }
  }
}
