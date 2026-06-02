package com.planthings.api.intelligence.tools;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AiCapabilityRegistry {

  public static final String WORKSPACE_GET_SUMMARY = "workspace.get_summary";
  public static final String PLAN_GET = "plan.get";
  public static final String BOARD_GET = "board.get";
  public static final String BOARD_CARD_SEARCH = "board.card.search";
  public static final String FILE_SEARCH_METADATA = "file.search_metadata";

  public static final String TOOL_CONTEXT_SEARCH = "context.search";
  public static final String TOOL_ENTITY_GET = "entity.get";
  public static final String OPENAI_TOOL_CONTEXT_SEARCH = "context_search";
  public static final String OPENAI_TOOL_ENTITY_GET = "entity_get";

  private final Map<String, CapabilityDefinition> definitions;

  public AiCapabilityRegistry() {
    Map<String, CapabilityDefinition> items = new LinkedHashMap<>();
    items.put(WORKSPACE_GET_SUMMARY, new CapabilityDefinition(WORKSPACE_GET_SUMMARY, "Resume o workspace atual."));
    items.put(PLAN_GET, new CapabilityDefinition(PLAN_GET, "Busca detalhes estruturados de um plano."));
    items.put(BOARD_GET, new CapabilityDefinition(BOARD_GET, "Busca um resumo estruturado do board de um plano."));
    items.put(BOARD_CARD_SEARCH, new CapabilityDefinition(BOARD_CARD_SEARCH, "Busca cards dentro do plano em foco."));
    items.put(FILE_SEARCH_METADATA, new CapabilityDefinition(FILE_SEARCH_METADATA, "Busca arquivos por metadados no escopo autorizado."));
    this.definitions = Map.copyOf(items);
  }

  public boolean contains(String capabilityId) {
    return definitions.containsKey(capabilityId);
  }

  public CapabilityDefinition get(String capabilityId) {
    return definitions.get(capabilityId);
  }

  public static String toCanonicalToolName(String toolName) {
    String normalized = normalizeToolName(toolName);
    return switch (normalized) {
      case TOOL_CONTEXT_SEARCH, OPENAI_TOOL_CONTEXT_SEARCH -> TOOL_CONTEXT_SEARCH;
      case TOOL_ENTITY_GET, OPENAI_TOOL_ENTITY_GET -> TOOL_ENTITY_GET;
      default -> normalized;
    };
  }

  public static String toOpenAiToolName(String toolName) {
    String canonical = toCanonicalToolName(toolName);
    return switch (canonical) {
      case TOOL_CONTEXT_SEARCH -> OPENAI_TOOL_CONTEXT_SEARCH;
      case TOOL_ENTITY_GET -> OPENAI_TOOL_ENTITY_GET;
      default -> canonical;
    };
  }

  private static String normalizeToolName(String value) {
    return String.valueOf(value == null ? "" : value).trim().toLowerCase();
  }

  public record CapabilityDefinition(String id, String description) {
  }
}
