package com.planthings.api.intelligence.tools;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planthings.api.common.error.ApiException;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.intelligence.model.AiToolCallStatus;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AiModelToolRouter {

  private final ObjectMapper objectMapper;
  private final AiReadOnlyCapabilityService readOnlyCapabilityService;

  public AiModelToolRouter(
      ObjectMapper objectMapper,
      AiReadOnlyCapabilityService readOnlyCapabilityService
  ) {
    this.objectMapper = objectMapper;
    this.readOnlyCapabilityService = readOnlyCapabilityService;
  }

  public ModelToolExecution execute(String toolName, JsonNode arguments, AiToolExecutionContext context) {
    String normalizedToolName = normalize(toolName);
    try {
      return switch (normalizedToolName) {
        case AiCapabilityRegistry.TOOL_CONTEXT_SEARCH -> executeContextSearch(arguments, context);
        case AiCapabilityRegistry.TOOL_ENTITY_GET -> executeEntityGet(arguments, context);
        default -> {
          CapabilityExecutionAudit audit = failedAudit(
              null,
              "TOOL_NAO_SUPORTADA",
              "Ferramenta nao suportada: " + toolName,
              "{}"
          );
          yield new ModelToolExecution(errorNode(audit.errorCode(), audit.message()), List.of(audit));
        }
      };
    } catch (ApiException exception) {
      CapabilityExecutionAudit audit = failedAudit(
          null,
          exception.getCode(),
          exception.getMessage(),
          serialize(errorNode(exception.getCode(), exception.getMessage()))
      );
      return new ModelToolExecution(errorNode(exception.getCode(), exception.getMessage()), List.of(audit));
    }
  }

  private ModelToolExecution executeContextSearch(JsonNode arguments, AiToolExecutionContext context) {
    ObjectNode output = objectMapper.createObjectNode();
    ArrayNode results = output.putArray("results");
    ArrayNode errors = output.putArray("errors");
    List<CapabilityExecutionAudit> audits = new ArrayList<>();
    Set<String> seen = new LinkedHashSet<>();

    String query = requireString(arguments.path("query"), "query");
    int limit = requireLimit(arguments.path("limit"));
    Set<String> includes = parseIncludes(arguments.path("include"), context);

    if (includes.contains("workspace")) {
      appendSingleEntityResult(results, seen, audits, executeCapability(AiCapabilityRegistry.WORKSPACE_GET_SUMMARY,
          () -> readOnlyCapabilityService.getWorkspaceSummary(context)));
    }
    if (includes.contains("plan") && context.planId() != null) {
      appendSingleEntityResult(results, seen, audits, executeCapability(AiCapabilityRegistry.PLAN_GET,
          () -> readOnlyCapabilityService.getPlan(context, context.planId())));
    }
    if (includes.contains("board") && context.planId() != null) {
      appendSingleEntityResult(results, seen, audits, executeCapability(AiCapabilityRegistry.BOARD_GET,
          () -> readOnlyCapabilityService.getBoard(context, context.planId())));
    }
    if (includes.contains("cards")) {
      appendArrayResults(results, seen, audits, executeCapability(AiCapabilityRegistry.BOARD_CARD_SEARCH,
          () -> readOnlyCapabilityService.searchCards(context, query, limit)));
    }
    if (includes.contains("files")) {
      appendArrayResults(results, seen, audits, executeCapability(AiCapabilityRegistry.FILE_SEARCH_METADATA,
          () -> readOnlyCapabilityService.searchFileMetadata(context, query, limit)));
    }

    for (CapabilityExecutionAudit audit : audits) {
      if (audit.status() == AiToolCallStatus.FAILED) {
        ObjectNode error = errors.addObject();
        error.put("capabilityId", String.valueOf(audit.capabilityId() == null ? "" : audit.capabilityId()));
        error.put("code", audit.errorCode());
        error.put("message", audit.message());
      }
    }

    trimResults(results, limit);
    return new ModelToolExecution(output, audits);
  }

  private ModelToolExecution executeEntityGet(JsonNode arguments, AiToolExecutionContext context) {
    String entityType = requireString(arguments.path("entityType"), "entityType").toLowerCase(Locale.ROOT);
    UUID entityId = parseRequiredUuid(requireString(arguments.path("entityId"), "entityId"), "entityId invalido.");

    CapabilityOutcome outcome = switch (entityType) {
      case "workspace" -> executeCapability(AiCapabilityRegistry.WORKSPACE_GET_SUMMARY, () -> {
        if (!entityId.equals(context.workspaceId())) {
          throw new BadRequestException("WORKSPACE_INVALIDO", "O workspace solicitado nao pertence a esta conversa.");
        }
        return readOnlyCapabilityService.getWorkspaceSummary(context);
      });
      case "plan" -> executeCapability(AiCapabilityRegistry.PLAN_GET,
          () -> readOnlyCapabilityService.getPlan(context, entityId));
      case "board" -> executeCapability(AiCapabilityRegistry.BOARD_GET,
          () -> readOnlyCapabilityService.getBoard(context, entityId));
      case "file" -> executeCapability(AiCapabilityRegistry.FILE_SEARCH_METADATA,
          () -> readOnlyCapabilityService.getFile(context, entityId));
      default -> failedOutcome(
          null,
          "ENTITY_TYPE_NAO_SUPORTADO",
          "entityType nao suportado: " + entityType,
          "{}"
      );
    };

    return new ModelToolExecution(outcome.output(), List.of(outcome.audit()));
  }

  private CapabilityOutcome executeCapability(String capabilityId, ThrowingSupplier supplier) {
    OffsetDateTime startedAt = OffsetDateTime.now(ZoneOffset.UTC);
    long startedNanos = System.nanoTime();
    try {
      JsonNode output = supplier.get();
      String resultJson = serialize(output);
      return new CapabilityOutcome(
          output,
          new CapabilityExecutionAudit(
              capabilityId,
              AiToolCallStatus.COMPLETED,
              null,
              null,
              startedAt,
              OffsetDateTime.now(ZoneOffset.UTC),
              toDurationMillis(startedNanos),
              resultJson
          )
      );
    } catch (ApiException exception) {
      return failedOutcome(
          capabilityId,
          exception.getCode(),
          exception.getMessage(),
          serialize(errorNode(exception.getCode(), exception.getMessage())),
          startedAt,
          startedNanos
      );
    } catch (Exception exception) {
      return failedOutcome(
          capabilityId,
          "TOOL_EXECUTION_FAILED",
          "Nao foi possivel concluir a ferramenta agora.",
          serialize(errorNode("TOOL_EXECUTION_FAILED", "Nao foi possivel concluir a ferramenta agora.")),
          startedAt,
          startedNanos
      );
    }
  }

  private CapabilityOutcome failedOutcome(
      String capabilityId,
      String errorCode,
      String message,
      String resultJson
  ) {
    return failedOutcome(capabilityId, errorCode, message, resultJson, OffsetDateTime.now(ZoneOffset.UTC), System.nanoTime());
  }

  private CapabilityOutcome failedOutcome(
      String capabilityId,
      String errorCode,
      String message,
      String resultJson,
      OffsetDateTime startedAt,
      long startedNanos
  ) {
    return new CapabilityOutcome(
        errorNode(errorCode, message),
        failedAudit(capabilityId, errorCode, message, resultJson, startedAt, startedNanos)
    );
  }

  private CapabilityExecutionAudit failedAudit(
      String capabilityId,
      String errorCode,
      String message,
      String resultJson
  ) {
    return failedAudit(capabilityId, errorCode, message, resultJson, OffsetDateTime.now(ZoneOffset.UTC), System.nanoTime());
  }

  private CapabilityExecutionAudit failedAudit(
      String capabilityId,
      String errorCode,
      String message,
      String resultJson,
      OffsetDateTime startedAt,
      long startedNanos
  ) {
    return new CapabilityExecutionAudit(
        capabilityId,
        AiToolCallStatus.FAILED,
        errorCode,
        message,
        startedAt,
        OffsetDateTime.now(ZoneOffset.UTC),
        toDurationMillis(startedNanos),
        resultJson
    );
  }

  private void appendSingleEntityResult(
      ArrayNode results,
      Set<String> seen,
      List<CapabilityExecutionAudit> audits,
      CapabilityOutcome outcome
  ) {
    audits.add(outcome.audit());
    if (outcome.audit().status() == AiToolCallStatus.FAILED) {
      return;
    }
    appendIfNew(results, seen, outcome.output());
  }

  private void appendArrayResults(
      ArrayNode results,
      Set<String> seen,
      List<CapabilityExecutionAudit> audits,
      CapabilityOutcome outcome
  ) {
    audits.add(outcome.audit());
    if (outcome.audit().status() == AiToolCallStatus.FAILED) {
      return;
    }
    if (outcome.output() != null && outcome.output().isArray()) {
      for (JsonNode item : outcome.output()) {
        appendIfNew(results, seen, item);
      }
    }
  }

  private void appendIfNew(ArrayNode results, Set<String> seen, JsonNode item) {
    if (item == null || !item.isObject()) {
      return;
    }
    String key = item.path("entityType").asText("") + ":" + item.path("entityId").asText("");
    if (!seen.add(key)) {
      return;
    }
    results.add(item.deepCopy());
  }

  private void trimResults(ArrayNode results, int limit) {
    while (results.size() > limit) {
      results.remove(results.size() - 1);
    }
  }

  private Set<String> parseIncludes(JsonNode node, AiToolExecutionContext context) {
    LinkedHashSet<String> includes = new LinkedHashSet<>();
    if (node != null && node.isArray()) {
      for (JsonNode item : node) {
        String value = normalize(item.asText(""));
        if (!value.isEmpty()) {
          includes.add(value);
        }
      }
    }

    if (!includes.isEmpty()) {
      return includes;
    }

    includes.add("workspace");
    if (context.planId() != null) {
      includes.add("plan");
      includes.add("board");
      includes.add("cards");
      includes.add("files");
    } else {
      includes.add("files");
    }
    return includes;
  }

  private int requireLimit(JsonNode node) {
    if (node == null || !node.isInt()) {
      throw new BadRequestException("LIMIT_INVALIDO", "limit deve ser um inteiro entre 1 e 12.");
    }
    int value = node.asInt();
    if (value < 1 || value > 12) {
      throw new BadRequestException("LIMIT_INVALIDO", "limit deve ser um inteiro entre 1 e 12.");
    }
    return value;
  }

  private String requireString(JsonNode node, String fieldName) {
    if (node == null || !node.isTextual()) {
      throw new BadRequestException("CAMPO_INVALIDO", fieldName + " deve ser uma string.");
    }
    String value = node.asText("").trim();
    if (!StringUtils.hasText(value)) {
      throw new BadRequestException("CAMPO_INVALIDO", fieldName + " deve ser informado.");
    }
    return value;
  }

  private UUID parseRequiredUuid(String value, String message) {
    try {
      return UUID.fromString(value);
    } catch (IllegalArgumentException exception) {
      throw new BadRequestException("UUID_INVALIDO", message);
    }
  }

  private int toDurationMillis(long startedNanos) {
    return (int) Math.max(0L, (System.nanoTime() - startedNanos) / 1_000_000L);
  }

  private ObjectNode errorNode(String code, String message) {
    ObjectNode node = objectMapper.createObjectNode();
    node.put("ok", false);
    ObjectNode error = node.putObject("error");
    error.put("code", String.valueOf(code == null ? "" : code));
    error.put("message", String.valueOf(message == null ? "" : message));
    return node;
  }

  private String serialize(JsonNode value) {
    try {
      return objectMapper.writeValueAsString(value == null ? objectMapper.createObjectNode() : value);
    } catch (Exception exception) {
      return "{}";
    }
  }

  private String normalize(String value) {
    return String.valueOf(value == null ? "" : value).trim().toLowerCase(Locale.ROOT);
  }

  public record ModelToolExecution(
      JsonNode output,
      List<CapabilityExecutionAudit> audits
  ) {
    public boolean hasFailures() {
      return audits.stream().anyMatch(audit -> audit.status() == AiToolCallStatus.FAILED);
    }

    public boolean isFullyFailed() {
      return !audits.isEmpty() && audits.stream().allMatch(audit -> audit.status() == AiToolCallStatus.FAILED);
    }
  }

  public record CapabilityExecutionAudit(
      String capabilityId,
      AiToolCallStatus status,
      String errorCode,
      String message,
      OffsetDateTime startedAt,
      OffsetDateTime completedAt,
      int durationMs,
      String resultJson
  ) {
  }

  private record CapabilityOutcome(
      JsonNode output,
      CapabilityExecutionAudit audit
  ) {
  }

  @FunctionalInterface
  private interface ThrowingSupplier {
    JsonNode get();
  }
}
