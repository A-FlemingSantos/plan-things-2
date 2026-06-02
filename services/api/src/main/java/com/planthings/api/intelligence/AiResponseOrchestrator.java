package com.planthings.api.intelligence;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planthings.api.intelligence.persistence.AiContextSnapshotRepository;
import com.planthings.api.intelligence.model.AiMessageBlockType;
import com.planthings.api.intelligence.model.AiMessageRole;
import com.planthings.api.intelligence.model.AiMessageStatus;
import com.planthings.api.intelligence.openai.AiOpenAiClient;
import com.planthings.api.intelligence.openai.OpenAiResponseRequest;
import com.planthings.api.intelligence.openai.OpenAiResponseResult;
import com.planthings.api.intelligence.persistence.AiConversationEntity;
import com.planthings.api.intelligence.persistence.AiConversationRepository;
import com.planthings.api.intelligence.blocks.AiEntityReferenceResolver;
import com.planthings.api.intelligence.blocks.AiMessageBlockWriter;
import com.planthings.api.intelligence.blocks.ResolvedEntityReferenceBlock;
import com.planthings.api.intelligence.model.AiConversationScopeType;
import com.planthings.api.intelligence.persistence.AiMessageBlockEntity;
import com.planthings.api.intelligence.persistence.AiMessageBlockRepository;
import com.planthings.api.intelligence.persistence.AiMessageEntity;
import com.planthings.api.intelligence.persistence.AiMessageRepository;
import com.planthings.api.intelligence.persistence.AiToolCallEntity;
import com.planthings.api.intelligence.persistence.AiToolCallRepository;
import com.planthings.api.intelligence.tools.AiModelToolRegistry;
import com.planthings.api.intelligence.tools.AiModelToolRouter;
import com.planthings.api.intelligence.tools.AiToolExecutionContext;
import jakarta.annotation.PreDestroy;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

@Service
public class AiResponseOrchestrator {

  private static final Logger logger = LoggerFactory.getLogger(AiResponseOrchestrator.class);
  private static final String DEFAULT_ERROR_CODE = "OPENAI_FALHA";
  private static final String DEFAULT_ERROR_TEXT = "Nao foi possivel obter resposta da IA agora.";
  private static final String DEFAULT_EMPTY_RESPONSE_TEXT = "Nao encontrei uma resposta util para esse pedido ainda.";
  private static final int MAX_LOCAL_CONTEXT_MESSAGES = 24;
  private static final int MAX_TOOL_ROUNDS = 6;
  private static final String DEFAULT_SYSTEM_PROMPT = """
      Voce e o Plan Things Intelligence, copiloto operacional do workspace.
      Responda em portugues, seja objetivo e nunca invente objetos do workspace.
      """;

  private final AiConversationRepository conversationRepository;
  private final AiMessageRepository messageRepository;
  private final AiMessageBlockRepository messageBlockRepository;
  private final AiOpenAiClient aiOpenAiClient;
  private final IntelligenceProperties properties;
  private final AiStreamingService streamingService;
  private final AiContextSnapshotRepository contextSnapshotRepository;
  private final AiContextBuilder contextBuilder;
  private final AiCompactionService compactionService;
  private final AiEntityReferenceResolver entityReferenceResolver;
  private final AiMessageBlockWriter messageBlockWriter;
  private final AiToolCallRepository toolCallRepository;
  private final AiModelToolRegistry modelToolRegistry;
  private final AiModelToolRouter modelToolRouter;
  private final TransactionTemplate transactionTemplate;
  private final ObjectMapper objectMapper;
  private final ConcurrentHashMap<UUID, AtomicBoolean> cancellationFlags = new ConcurrentHashMap<>();
  private final ExecutorService executor = Executors.newCachedThreadPool(runnable -> {
    Thread thread = new Thread(runnable, "ai-response-orchestrator");
    thread.setDaemon(true);
    return thread;
  });

  public AiResponseOrchestrator(
      AiConversationRepository conversationRepository,
      AiMessageRepository messageRepository,
      AiMessageBlockRepository messageBlockRepository,
      AiOpenAiClient aiOpenAiClient,
      IntelligenceProperties properties,
      AiStreamingService streamingService,
      AiContextSnapshotRepository contextSnapshotRepository,
      AiContextBuilder contextBuilder,
      AiCompactionService compactionService,
      AiEntityReferenceResolver entityReferenceResolver,
      AiMessageBlockWriter messageBlockWriter,
      AiToolCallRepository toolCallRepository,
      AiModelToolRegistry modelToolRegistry,
      AiModelToolRouter modelToolRouter,
      TransactionTemplate transactionTemplate,
      ObjectMapper objectMapper
  ) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
    this.messageBlockRepository = messageBlockRepository;
    this.aiOpenAiClient = aiOpenAiClient;
    this.properties = properties;
    this.streamingService = streamingService;
    this.contextSnapshotRepository = contextSnapshotRepository;
    this.contextBuilder = contextBuilder;
    this.compactionService = compactionService;
    this.entityReferenceResolver = entityReferenceResolver;
    this.messageBlockWriter = messageBlockWriter;
    this.toolCallRepository = toolCallRepository;
    this.modelToolRegistry = modelToolRegistry;
    this.modelToolRouter = modelToolRouter;
    this.transactionTemplate = transactionTemplate;
    this.objectMapper = objectMapper;
  }

  public void requestCancellation(UUID assistantMessageId) {
    cancellationFlags.computeIfAbsent(assistantMessageId, ignored -> new AtomicBoolean(false))
        .set(true);
  }

  public void enqueueResponse(UUID conversationId, UUID userMessageId, UUID assistantMessageId) {
    cancellationFlags.putIfAbsent(assistantMessageId, new AtomicBoolean(false));
    SecurityContext taskSecurityContext = captureSecurityContext();
    executor.submit(() -> {
      try {
        SecurityContextHolder.setContext(taskSecurityContext);
        processResponse(conversationId, userMessageId, assistantMessageId);
      } finally {
        SecurityContextHolder.clearContext();
      }
    });
  }

  @PreDestroy
  void shutdownExecutor() {
    executor.shutdownNow();
  }

  private void processResponse(UUID conversationId, UUID userMessageId, UUID assistantMessageId) {
    try {
      OrchestrationContext context = transactionTemplate.execute(status -> loadContext(conversationId, userMessageId, assistantMessageId));
      if (context == null) {
        return;
      }

      if (isCancellationRequested(assistantMessageId)) {
        handleCancellation(conversationId, assistantMessageId);
        return;
      }

      markAssistantStreaming(assistantMessageId);

      AiToolExecutionContext toolContext = new AiToolExecutionContext(
          conversationId,
          assistantMessageId,
          context.userId(),
          context.workspaceId(),
          context.planId(),
          context.cardId(),
          context.scopeType()
      );

      List<JsonNode> modelTools = modelToolRegistry.buildTools(toolContext).stream()
          .map(definition -> definition.toOpenAiToolJson(objectMapper))
          .toList();

      OpenAiResponseResult response = executeResponseLoop(
          context,
          assistantMessageId,
          toolContext,
          modelTools
      );

      if (isCancellationRequested(assistantMessageId)) {
        handleCancellation(conversationId, assistantMessageId);
        return;
      }

      String outputText = normalizeOutputText(response.outputText());

      List<AiMessageBlockEntity> savedBlocks = transactionTemplate.execute(status -> completeAssistantMessage(
          conversationId,
          assistantMessageId,
          response,
          outputText,
          context
      ));

      if (savedBlocks != null) {
        publishBlockCreatedEvents(conversationId, assistantMessageId, savedBlocks);
      }

      compactionService.recordCompactionOutput(
        conversationId,
        assistantMessageId,
        response.responseId(),
        response.compactionOutputItemsJson(),
        response.tokenUsageJson()
      );

      streamingService.sendEvent(conversationId, "assistant.completed", Map.of(
          "conversationId", conversationId.toString(),
          "messageId", assistantMessageId.toString(),
          "status", AiMessageStatus.COMPLETED.name()
      ));
    } catch (Exception exception) {
      if (isCancellationRequested(assistantMessageId)) {
        handleCancellation(conversationId, assistantMessageId);
        return;
      }
      logger.warn("Falha ao processar resposta da conversa {}", conversationId, exception);
      transactionTemplate.executeWithoutResult(status -> failAssistantMessage(assistantMessageId, DEFAULT_ERROR_CODE, DEFAULT_ERROR_TEXT));
      streamingService.sendEvent(conversationId, "assistant.failed", Map.of(
          "conversationId", conversationId.toString(),
          "messageId", assistantMessageId.toString(),
          "status", AiMessageStatus.FAILED.name(),
          "errorCode", DEFAULT_ERROR_CODE,
          "message", DEFAULT_ERROR_TEXT
      ));
    } finally {
      cancellationFlags.remove(assistantMessageId);
    }
  }

  private void handleCancellation(UUID conversationId, UUID assistantMessageId) {
    boolean updated = Boolean.TRUE.equals(transactionTemplate.execute(status -> {
      AiMessageEntity assistantMessage = messageRepository.findById(assistantMessageId).orElse(null);
      if (assistantMessage == null || assistantMessage.getStatus() == AiMessageStatus.CANCELLED) {
        return false;
      }
      if (assistantMessage.getStatus() == AiMessageStatus.COMPLETED) {
        return false;
      }
      assistantMessage.setStatus(AiMessageStatus.CANCELLED);
      if (!StringUtils.hasText(assistantMessage.getContentText())) {
        assistantMessage.setContentText("Resposta cancelada.");
      }
      messageRepository.save(assistantMessage);
      return true;
    }));

    if (Boolean.TRUE.equals(updated)) {
      streamingService.sendEvent(conversationId, "assistant.cancelled", Map.of(
          "conversationId", conversationId.toString(),
          "messageId", assistantMessageId.toString(),
          "status", AiMessageStatus.CANCELLED.name()
      ));
    }
  }

  private boolean isCancellationRequested(UUID assistantMessageId) {
    AtomicBoolean flag = cancellationFlags.get(assistantMessageId);
    return flag != null && flag.get();
  }

  private SecurityContext captureSecurityContext() {
    SecurityContext currentContext = SecurityContextHolder.getContext();
    SecurityContext capturedContext = SecurityContextHolder.createEmptyContext();
    if (currentContext != null) {
      capturedContext.setAuthentication(currentContext.getAuthentication());
    }
    return capturedContext;
  }

  private OrchestrationContext loadContext(UUID conversationId, UUID userMessageId, UUID assistantMessageId) {
    AiConversationEntity conversation = conversationRepository.findById(conversationId).orElse(null);
    AiMessageEntity userMessage = messageRepository.findById(userMessageId).orElse(null);
    AiMessageEntity assistantMessage = messageRepository.findById(assistantMessageId).orElse(null);
    if (conversation == null || userMessage == null || assistantMessage == null) {
      return null;
    }

    List<OpenAiResponseRequest.OpenAiInputMessage> localConversationInput = buildLocalConversationInput(conversation.getId());

    String contextSnapshotJson = contextSnapshotRepository.findByMessageId(userMessageId)
        .map(snapshot -> snapshot.getContextJson())
        .orElse(null);

    return new OrchestrationContext(
        conversation.getId(),
        conversation.getCreatedByUserId(),
        conversation.getWorkspaceId(),
        conversation.getScopeType(),
        conversation.getPlanId(),
        conversation.getCardId(),
        conversation.getLastOpenaiResponseId(),
        localConversationInput,
        userMessage.getContentText(),
        contextSnapshotJson
    );
  }

  private OpenAiResponseRequest buildRequest(
      OrchestrationContext context,
      boolean forceLocalState,
      List<JsonNode> extraRawInputItems,
      List<JsonNode> modelTools
  ) {
    boolean useOpenAiState =
        !forceLocalState &&
        properties.isUseOpenaiConversations()
            && properties.isStoreOpenaiResponses()
            && StringUtils.hasText(context.previousResponseId());

    List<OpenAiResponseRequest.OpenAiInputMessage> input;
    if (useOpenAiState) {
      input = buildOpenAiStateInput(context);
      if (input.isEmpty()) {
        useOpenAiState = false;
        input = buildLocalStateInput(context);
      }
    } else {
      input = buildLocalStateInput(context);
    }

    Integer compactThreshold = properties.getCompactThreshold() > 0
        ? properties.getCompactThreshold()
        : null;

    List<com.fasterxml.jackson.databind.JsonNode> rawInputItems = new ArrayList<>();
    if (!useOpenAiState) {
      rawInputItems.addAll(compactionService.loadLatestCompactionInputItems(context.conversationId()));
    }

    return new OpenAiResponseRequest(
        properties.getModel(),
        properties.getReasoningEffort(),
        properties.getMaxOutputTokens(),
        properties.isStoreOpenaiResponses(),
        useOpenAiState ? context.previousResponseId() : null,
        input,
        rawInputItems,
        extraRawInputItems == null ? List.of() : List.copyOf(extraRawInputItems),
        compactThreshold,
        modelTools == null ? List.of() : modelTools
    );
  }

  private OpenAiResponseResult executeResponseLoop(
      OrchestrationContext context,
      UUID assistantMessageId,
      AiToolExecutionContext toolContext,
      List<JsonNode> modelTools
  ) {
    boolean forceLocalState = modelTools != null && !modelTools.isEmpty();
    List<JsonNode> extraRawInputItems = new ArrayList<>();
    OpenAiResponseResult latestResponse = null;

    for (int round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      latestResponse = aiOpenAiClient.createResponseStream(
          buildRequest(context, forceLocalState, extraRawInputItems, modelTools),
          delta -> {
            if (isCancellationRequested(assistantMessageId)) {
              return;
            }
            streamAssistantDelta(context.conversationId(), assistantMessageId, delta);
          }
      );

      if (isCancellationRequested(assistantMessageId)) {
        return latestResponse;
      }

      List<ModelFunctionCall> functionCalls = extractFunctionCalls(latestResponse.outputItems());
      if (functionCalls.isEmpty()) {
        return latestResponse;
      }

      extraRawInputItems.addAll(latestResponse.outputItems());
      extraRawInputItems.addAll(executeToolCalls(
          context.conversationId(),
          assistantMessageId,
          latestResponse.responseId(),
          functionCalls,
          toolContext
      ));
    }

    if (latestResponse != null) {
      return new OpenAiResponseResult(
          latestResponse.responseId(),
          DEFAULT_EMPTY_RESPONSE_TEXT,
          latestResponse.tokenUsageJson(),
          latestResponse.compactionOutputItemsJson(),
          latestResponse.outputItems()
      );
    }

    throw new IllegalStateException("Nenhuma resposta da OpenAI foi produzida no loop de tools.");
  }

  private List<JsonNode> executeToolCalls(
      UUID conversationId,
      UUID assistantMessageId,
      String openaiResponseId,
      List<ModelFunctionCall> functionCalls,
      AiToolExecutionContext toolContext
  ) {
    List<JsonNode> toolOutputItems = new ArrayList<>();

    for (ModelFunctionCall functionCall : functionCalls) {
      if (isCancellationRequested(assistantMessageId)) {
        break;
      }

      String canonicalToolName = com.planthings.api.intelligence.tools.AiCapabilityRegistry.toCanonicalToolName(functionCall.name());

      streamingService.sendEvent(conversationId, "tool.started", Map.of(
          "conversationId", conversationId.toString(),
          "messageId", assistantMessageId.toString(),
          "toolName", canonicalToolName,
          "callId", functionCall.callId()
      ));

      AiModelToolRouter.ModelToolExecution execution = executeModelTool(functionCall, toolContext);
      persistToolCallAudits(conversationId, assistantMessageId, openaiResponseId, functionCall, canonicalToolName, execution);

      if (execution.isFullyFailed()) {
        String errorCode = execution.audits().isEmpty() ? DEFAULT_ERROR_CODE : String.valueOf(execution.audits().get(0).errorCode());
        String message = execution.audits().isEmpty() ? DEFAULT_ERROR_TEXT : String.valueOf(execution.audits().get(0).message());
        streamingService.sendEvent(conversationId, "tool.failed", Map.of(
            "conversationId", conversationId.toString(),
            "messageId", assistantMessageId.toString(),
            "toolName", canonicalToolName,
            "callId", functionCall.callId(),
            "errorCode", errorCode,
            "message", message
        ));
      } else {
        streamingService.sendEvent(conversationId, "tool.completed", Map.of(
            "conversationId", conversationId.toString(),
            "messageId", assistantMessageId.toString(),
            "toolName", canonicalToolName,
            "callId", functionCall.callId()
        ));
      }

      toolOutputItems.add(buildFunctionCallOutputItem(functionCall.callId(), execution.output()));
    }

    return toolOutputItems;
  }

  private AiModelToolRouter.ModelToolExecution executeModelTool(
      ModelFunctionCall functionCall,
      AiToolExecutionContext toolContext
  ) {
    try {
      JsonNode arguments = objectMapper.readTree(functionCall.argumentsJson());
      return modelToolRouter.execute(functionCall.name(), arguments, toolContext);
    } catch (Exception exception) {
      ObjectMapper mapper = objectMapper;
      ObjectNode errorOutput = mapper.createObjectNode();
      errorOutput.put("ok", false);
      ObjectNode error = errorOutput.putObject("error");
      error.put("code", "TOOL_ARGUMENTS_INVALIDOS");
      error.put("message", "Os argumentos da ferramenta nao puderam ser lidos.");

      OffsetDateTime startedAt = OffsetDateTime.now(ZoneOffset.UTC);
      return new AiModelToolRouter.ModelToolExecution(
          errorOutput,
          List.of(new AiModelToolRouter.CapabilityExecutionAudit(
              null,
              com.planthings.api.intelligence.model.AiToolCallStatus.FAILED,
              "TOOL_ARGUMENTS_INVALIDOS",
              "Os argumentos da ferramenta nao puderam ser lidos.",
              startedAt,
              OffsetDateTime.now(ZoneOffset.UTC),
              0,
              serializeJson(errorOutput)
          ))
      );
    }
  }

  private void persistToolCallAudits(
      UUID conversationId,
      UUID assistantMessageId,
      String openaiResponseId,
      ModelFunctionCall functionCall,
      String canonicalToolName,
      AiModelToolRouter.ModelToolExecution execution
  ) {
    transactionTemplate.executeWithoutResult(status -> {
      for (AiModelToolRouter.CapabilityExecutionAudit audit : execution.audits()) {
        AiToolCallEntity entity = new AiToolCallEntity();
        entity.setConversationId(conversationId);
        entity.setMessageId(assistantMessageId);
        entity.setOpenaiResponseId(openaiResponseId);
        entity.setToolName(canonicalToolName);
        entity.setCapabilityId(audit.capabilityId());
        entity.setStatus(audit.status());
        entity.setArgumentsJson(functionCall.argumentsJson());
        entity.setResultJson(audit.resultJson());
        entity.setErrorCode(audit.errorCode());
        entity.setStartedAt(audit.startedAt());
        entity.setCompletedAt(audit.completedAt());
        entity.setDurationMs(audit.durationMs());
        toolCallRepository.save(entity);
      }
    });
  }

  private JsonNode buildFunctionCallOutputItem(String callId, JsonNode output) {
    ObjectNode item = objectMapper.createObjectNode();
    item.put("type", "function_call_output");
    item.put("call_id", callId);
    item.put("output", serializeJson(output));
    return item;
  }

  private List<ModelFunctionCall> extractFunctionCalls(List<JsonNode> outputItems) {
    if (outputItems == null || outputItems.isEmpty()) {
      return List.of();
    }

    List<ModelFunctionCall> functionCalls = new ArrayList<>();
    for (JsonNode item : outputItems) {
      if (item == null || !item.isObject()) {
        continue;
      }
      if (!"function_call".equals(item.path("type").asText(""))) {
        continue;
      }
      String name = item.path("name").asText("");
      String argumentsJson = item.path("arguments").asText("{}");
      String callId = item.path("call_id").asText("");
      if (!StringUtils.hasText(name) || !StringUtils.hasText(callId)) {
        continue;
      }
      functionCalls.add(new ModelFunctionCall(callId, name, argumentsJson));
    }
    return functionCalls;
  }

  private String buildSystemPrompt(OrchestrationContext context) {
    StringBuilder prompt = new StringBuilder(DEFAULT_SYSTEM_PROMPT.strip());

    if (context.scopeType() != null) {
      prompt.append("\nEscopo atual: ").append(context.scopeType().name()).append('.');
    }
    if (context.planId() != null) {
      prompt.append("\nPlano em foco: ").append(context.planId()).append('.');
    }
    if (context.cardId() != null) {
      prompt.append("\nCartao em foco: ").append(context.cardId()).append('.');
    }

    JsonNode snapshot = contextBuilder.parseSnapshotJson(context.contextSnapshotJson());
    String snapshotPrompt = contextBuilder.formatSnapshotForPrompt(snapshot);
    if (StringUtils.hasText(snapshotPrompt)) {
      prompt.append("\n\nContexto anexado pelo usuario nesta mensagem:\n").append(snapshotPrompt);
    }

    return prompt.toString();
  }

  private void markAssistantStreaming(UUID assistantMessageId) {
    transactionTemplate.executeWithoutResult(status -> {
      AiMessageEntity assistantMessage = messageRepository.findById(assistantMessageId).orElse(null);
      if (assistantMessage == null) {
        return;
      }

      assistantMessage.setStatus(AiMessageStatus.STREAMING);
      messageRepository.save(assistantMessage);
    });
  }

  private void streamAssistantDelta(UUID conversationId, UUID assistantMessageId, String delta) {
    if (delta == null || delta.isEmpty()) {
      return;
    }
    streamingService.sendEvent(conversationId, "assistant.delta", Map.of(
        "conversationId", conversationId.toString(),
        "messageId", assistantMessageId.toString(),
        "status", AiMessageStatus.STREAMING.name(),
        "delta", delta
    ));
  }

  private List<AiMessageBlockEntity> completeAssistantMessage(
      UUID conversationId,
      UUID assistantMessageId,
      OpenAiResponseResult response,
      String outputText,
      OrchestrationContext context
  ) {
    AiConversationEntity conversation = conversationRepository.findById(conversationId).orElse(null);
    AiMessageEntity assistantMessage = messageRepository.findById(assistantMessageId).orElse(null);
    if (conversation == null || assistantMessage == null) {
      return List.of();
    }
    if (assistantMessage.getStatus() == AiMessageStatus.CANCELLED) {
      return List.of();
    }

    assistantMessage.setStatus(AiMessageStatus.COMPLETED);
    assistantMessage.setContentText(outputText);
    assistantMessage.setOpenaiResponseId(response.responseId());
    assistantMessage.setTokenUsageJson(response.tokenUsageJson());
    assistantMessage.setErrorCode(null);
    if (assistantMessage.getCreatedAt() == null) {
      assistantMessage.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
    }
    messageRepository.save(assistantMessage);

    List<ResolvedEntityReferenceBlock> referenceBlocks = entityReferenceResolver.resolveFromSnapshotJson(
        context.contextSnapshotJson(),
        context.userId()
    );

    List<AiMessageBlockEntity> savedBlocks = messageBlockWriter.replaceAssistantBlocks(
        assistantMessageId,
        toMarkdownPayloadJson(outputText),
        referenceBlocks
    );

    if (properties.isStoreOpenaiResponses()) {
      conversation.setLastOpenaiResponseId(response.responseId());
    } else {
      conversation.setLastOpenaiResponseId(null);
    }
    conversationRepository.save(conversation);
    return savedBlocks;
  }

  private void publishBlockCreatedEvents(
      UUID conversationId,
      UUID assistantMessageId,
      List<AiMessageBlockEntity> savedBlocks
  ) {
    for (AiMessageBlockEntity block : savedBlocks) {
      if (block.getBlockType() == AiMessageBlockType.MARKDOWN) {
        continue;
      }
      streamingService.sendEvent(conversationId, "block.created", toBlockCreatedPayload(
          conversationId,
          assistantMessageId,
          block
      ));
    }
  }

  private Map<String, Object> toBlockCreatedPayload(
      UUID conversationId,
      UUID messageId,
      AiMessageBlockEntity block
  ) {
    Map<String, Object> blockPayload = new LinkedHashMap<>();
    blockPayload.put("id", block.getId().toString());
    blockPayload.put("blockType", block.getBlockType().name());
    blockPayload.put("position", block.getPosition());
    if (block.getTitle() != null) {
      blockPayload.put("title", block.getTitle());
    }
    if (block.getHref() != null) {
      blockPayload.put("href", block.getHref());
    }
    if (block.getEntityType() != null) {
      blockPayload.put("entityType", block.getEntityType());
    }
    if (block.getEntityId() != null) {
      blockPayload.put("entityId", block.getEntityId().toString());
    }
    blockPayload.put("payloadJson", block.getPayloadJson());
    if (block.getSnapshotJson() != null) {
      blockPayload.put("snapshotJson", block.getSnapshotJson());
    }

    return Map.of(
        "conversationId", conversationId.toString(),
        "messageId", messageId.toString(),
        "block", blockPayload
    );
  }

  private List<OpenAiResponseRequest.OpenAiInputMessage> buildOpenAiStateInput(OrchestrationContext context) {
    List<OpenAiResponseRequest.OpenAiInputMessage> input = new ArrayList<>();
    String turnContextPrompt = buildTurnContextPrompt(context);
    if (StringUtils.hasText(turnContextPrompt)) {
      input.add(new OpenAiResponseRequest.OpenAiInputMessage("system", turnContextPrompt));
    }

    String userContent = normalizeInputText(context.userContent());
    if (!StringUtils.hasText(userContent) && StringUtils.hasText(context.contextSnapshotJson())) {
      userContent = "Use o contexto anexado nesta mensagem para responder.";
    }
    if (StringUtils.hasText(userContent)) {
      input.add(new OpenAiResponseRequest.OpenAiInputMessage("user", userContent));
    }
    return input;
  }

  private String buildTurnContextPrompt(OrchestrationContext context) {
    StringBuilder prompt = new StringBuilder();

    JsonNode snapshot = contextBuilder.parseSnapshotJson(context.contextSnapshotJson());
    String snapshotPrompt = contextBuilder.formatSnapshotForPrompt(snapshot);
    if (StringUtils.hasText(snapshotPrompt)) {
      prompt.append("Contexto anexado pelo usuario nesta mensagem:\n").append(snapshotPrompt);
    }

    return prompt.toString().trim();
  }

  private List<OpenAiResponseRequest.OpenAiInputMessage> buildLocalStateInput(OrchestrationContext context) {
    List<OpenAiResponseRequest.OpenAiInputMessage> input = new ArrayList<>();
    input.add(new OpenAiResponseRequest.OpenAiInputMessage("system", buildSystemPrompt(context)));

    if (context.localConversationInput() != null && !context.localConversationInput().isEmpty()) {
      input.addAll(context.localConversationInput());
      return input;
    }

    String userContent = normalizeInputText(context.userContent());
    if (!StringUtils.hasText(userContent) && StringUtils.hasText(context.contextSnapshotJson())) {
      userContent = "Use o contexto anexado nesta mensagem para responder.";
    }
    if (StringUtils.hasText(userContent)) {
      input.add(new OpenAiResponseRequest.OpenAiInputMessage("user", userContent));
    }
    return input;
  }

  private List<OpenAiResponseRequest.OpenAiInputMessage> buildLocalConversationInput(UUID conversationId) {
    List<AiMessageEntity> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    List<OpenAiResponseRequest.OpenAiInputMessage> input = new ArrayList<>();

    for (AiMessageEntity message : messages) {
      if (!isCompletedConversationalMessage(message)) {
        continue;
      }

      String role = toOpenAiRole(message.getRole());
      String content = normalizeInputText(message.getContentText());
      if (!StringUtils.hasText(content)) {
        continue;
      }
      input.add(new OpenAiResponseRequest.OpenAiInputMessage(role, content));
    }

    if (input.size() <= MAX_LOCAL_CONTEXT_MESSAGES) {
      return input;
    }
    return new ArrayList<>(input.subList(input.size() - MAX_LOCAL_CONTEXT_MESSAGES, input.size()));
  }

  private boolean isCompletedConversationalMessage(AiMessageEntity message) {
    if (message == null || message.getStatus() != AiMessageStatus.COMPLETED) {
      return false;
    }
    return message.getRole() == AiMessageRole.USER || message.getRole() == AiMessageRole.ASSISTANT;
  }

  private String toOpenAiRole(AiMessageRole role) {
    if (role == AiMessageRole.USER) {
      return "user";
    }
    if (role == AiMessageRole.ASSISTANT) {
      return "assistant";
    }
    throw new IllegalArgumentException("Role nao suportado para contexto conversacional: " + role);
  }

  private void failAssistantMessage(UUID assistantMessageId, String errorCode, String fallbackText) {
    AiMessageEntity assistantMessage = messageRepository.findById(assistantMessageId).orElse(null);
    if (assistantMessage == null) {
      return;
    }

    assistantMessage.setStatus(AiMessageStatus.FAILED);
    assistantMessage.setErrorCode(errorCode);
    if (!StringUtils.hasText(assistantMessage.getContentText())) {
      assistantMessage.setContentText(fallbackText);
    }
    messageRepository.save(assistantMessage);
  }

  private String normalizeOutputText(String value) {
    String normalized = String.valueOf(value == null ? "" : value).trim();
    return StringUtils.hasText(normalized) ? normalized : DEFAULT_EMPTY_RESPONSE_TEXT;
  }

  private String normalizeInputText(String value) {
    return String.valueOf(value == null ? "" : value).trim();
  }

  private String serializeJson(JsonNode value) {
    try {
      return objectMapper.writeValueAsString(value == null ? objectMapper.createObjectNode() : value);
    } catch (JsonProcessingException exception) {
      return "{}";
    }
  }

  private String toMarkdownPayloadJson(String markdown) {
    try {
      return objectMapper.writeValueAsString(Map.of("markdown", markdown));
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Nao foi possivel serializar o bloco markdown da resposta.", exception);
    }
  }

  private record OrchestrationContext(
      UUID conversationId,
      UUID userId,
      UUID workspaceId,
      AiConversationScopeType scopeType,
      UUID planId,
      UUID cardId,
      String previousResponseId,
      List<OpenAiResponseRequest.OpenAiInputMessage> localConversationInput,
      String userContent,
      String contextSnapshotJson
  ) {
  }

  private record ModelFunctionCall(
      String callId,
      String name,
      String argumentsJson
  ) {
  }
}
