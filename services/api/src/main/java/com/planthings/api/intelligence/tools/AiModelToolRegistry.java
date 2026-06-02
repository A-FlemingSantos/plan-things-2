package com.planthings.api.intelligence.tools;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class AiModelToolRegistry {

  private final ObjectMapper objectMapper;
  private final AiToolPermissionService permissionService;

  public AiModelToolRegistry(
      ObjectMapper objectMapper,
      AiToolPermissionService permissionService
  ) {
    this.objectMapper = objectMapper;
    this.permissionService = permissionService;
  }

  public List<ModelToolDefinition> buildTools(AiToolExecutionContext context) {
    List<ModelToolDefinition> tools = new ArrayList<>();
    if (permissionService.isModelToolEnabled(AiCapabilityRegistry.TOOL_CONTEXT_SEARCH, context)) {
      tools.add(new ModelToolDefinition(
          AiCapabilityRegistry.TOOL_CONTEXT_SEARCH,
          "Busca contexto read-only dentro do escopo autorizado do Plan Things.",
          buildContextSearchSchema()
      ));
    }
    if (permissionService.isModelToolEnabled(AiCapabilityRegistry.TOOL_ENTITY_GET, context)) {
      tools.add(new ModelToolDefinition(
          AiCapabilityRegistry.TOOL_ENTITY_GET,
          "Busca detalhes estruturados de uma entidade autorizada do Plan Things.",
          buildEntityGetSchema()
      ));
    }
    return List.copyOf(tools);
  }

  private JsonNode buildContextSearchSchema() {
    ObjectNode schema = objectMapper.createObjectNode();
    schema.put("type", "object");
    schema.put("additionalProperties", false);

    ObjectNode properties = schema.putObject("properties");
    properties.putObject("query").put("type", "string");

    ObjectNode include = properties.putObject("include");
    include.put("type", "array");
    ObjectNode items = include.putObject("items");
    items.put("type", "string");
    ArrayNode includeEnum = items.putArray("enum");
    includeEnum.add("workspace");
    includeEnum.add("plan");
    includeEnum.add("board");
    includeEnum.add("cards");
    includeEnum.add("files");

    ObjectNode limit = properties.putObject("limit");
    limit.put("type", "integer");
    limit.put("minimum", 1);
    limit.put("maximum", 12);

    ArrayNode required = schema.putArray("required");
    required.add("query");
    required.add("include");
    required.add("limit");
    return schema;
  }

  private JsonNode buildEntityGetSchema() {
    ObjectNode schema = objectMapper.createObjectNode();
    schema.put("type", "object");
    schema.put("additionalProperties", false);

    ObjectNode properties = schema.putObject("properties");
    ObjectNode entityType = properties.putObject("entityType");
    entityType.put("type", "string");
    ArrayNode entityTypeEnum = entityType.putArray("enum");
    entityTypeEnum.add("workspace");
    entityTypeEnum.add("plan");
    entityTypeEnum.add("board");
    entityTypeEnum.add("file");

    properties.putObject("entityId").put("type", "string");

    ArrayNode required = schema.putArray("required");
    required.add("entityType");
    required.add("entityId");
    return schema;
  }

  public record ModelToolDefinition(
      String name,
      String description,
      JsonNode parameters
  ) {
    public JsonNode toOpenAiToolJson(ObjectMapper objectMapper) {
      ObjectNode node = objectMapper.createObjectNode();
      node.put("type", "function");
      node.put("name", name);
      node.put("description", description);
      node.put("strict", true);
      node.set("parameters", parameters.deepCopy());
      return node;
    }
  }
}
