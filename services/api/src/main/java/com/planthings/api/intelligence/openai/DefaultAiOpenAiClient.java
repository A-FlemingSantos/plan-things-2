package com.planthings.api.intelligence.openai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.intelligence.IntelligenceProperties;
import java.util.ArrayList;
import java.util.List;
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

  private final RestClient restClient;
  private final ObjectMapper objectMapper;
  private final IntelligenceProperties properties;

  public DefaultAiOpenAiClient(
      RestClient.Builder restClientBuilder,
      ObjectMapper objectMapper,
      IntelligenceProperties properties
  ) {
    this.restClient = restClientBuilder.build();
    this.objectMapper = objectMapper;
    this.properties = properties;
  }

  @Override
  public boolean isConfigured() {
    return properties.isConfigured();
  }

  @Override
  public OpenAiResponseResult createResponse(OpenAiResponseRequest request) {
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
}
