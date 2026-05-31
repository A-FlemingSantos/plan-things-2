package com.planthings.api.intelligence;

import com.planthings.api.common.api.ApiEnvelope;
import com.planthings.api.intelligence.model.AiConversationScopeType;
import com.planthings.api.intelligence.model.AiConversationStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Validated
@RestController
@RequestMapping("/api/intelligence/conversations")
public class AiConversationController {

  private final AiConversationService conversationService;
  private final AiResponseOrchestrator responseOrchestrator;
  private final AiStreamingService streamingService;
  private final IntelligenceFeatureService intelligenceFeatureService;

  public AiConversationController(
      AiConversationService conversationService,
      AiResponseOrchestrator responseOrchestrator,
      AiStreamingService streamingService,
      IntelligenceFeatureService intelligenceFeatureService
  ) {
    this.conversationService = conversationService;
    this.responseOrchestrator = responseOrchestrator;
    this.streamingService = streamingService;
    this.intelligenceFeatureService = intelligenceFeatureService;
  }

  @GetMapping("/status")
  public ApiEnvelope<IntelligenceStatusResponse> getStatus() {
    var properties = intelligenceFeatureService.properties();
    return ApiEnvelope.ok(new IntelligenceStatusResponse(
        properties.isEnabled(),
        properties.isConfigured(),
        properties.getModel()
    ));
  }

  @GetMapping
  public ApiEnvelope<List<AiConversationService.ConversationSummary>> listConversations(
      @RequestParam(required = false) UUID planId,
      @RequestParam(required = false) UUID cardId,
      @RequestParam(required = false) AiConversationStatus status,
      @RequestParam(defaultValue = "30") @Min(1) @Max(100) int limit
  ) {
    return ApiEnvelope.ok(conversationService.listConversations(
        new AiConversationService.ListConversationsQuery(planId, cardId, status, limit)
    ));
  }

  @PostMapping
  public ApiEnvelope<AiConversationService.ConversationDetails> createConversation(
      @Valid @RequestBody CreateConversationRequest request
  ) {
    return ApiEnvelope.ok(conversationService.createConversation(new AiConversationService.CreateConversationCommand(
        request.planId(),
        request.cardId(),
        request.scopeType(),
        request.title()
    )));
  }

  @GetMapping("/{conversationId}")
  public ApiEnvelope<AiConversationService.ConversationDetails> getConversation(@PathVariable UUID conversationId) {
    return ApiEnvelope.ok(conversationService.getConversation(conversationId));
  }

  @PatchMapping("/{conversationId}")
  public ApiEnvelope<AiConversationService.ConversationDetails> updateConversation(
      @PathVariable UUID conversationId,
      @Valid @RequestBody UpdateConversationRequest request
  ) {
    return ApiEnvelope.ok(conversationService.updateConversation(
        conversationId,
        new AiConversationService.UpdateConversationCommand(request.title(), request.status())
    ));
  }

  @GetMapping("/{conversationId}/messages")
  public ApiEnvelope<List<AiConversationService.MessageDetails>> listMessages(@PathVariable UUID conversationId) {
    return ApiEnvelope.ok(conversationService.listMessages(conversationId));
  }

  @PostMapping("/{conversationId}/messages")
  public ApiEnvelope<AiConversationService.MessageAcceptedResult> createMessage(
      @PathVariable UUID conversationId,
      @Valid @RequestBody CreateMessageRequest request
  ) {
    AiConversationService.MessageAcceptedResult result = conversationService.createUserMessage(
        conversationId,
        request.content(),
        request.contextSnapshot()
    );
    responseOrchestrator.enqueueResponse(
        result.conversationId(),
        result.userMessageId(),
        result.assistantMessageId()
    );
    return ApiEnvelope.ok(result);
  }

  @PostMapping("/{conversationId}/messages/{messageId}/cancel")
  public ApiEnvelope<AiConversationService.MessageDetails> cancelMessage(
      @PathVariable UUID conversationId,
      @PathVariable UUID messageId
  ) {
    responseOrchestrator.requestCancellation(messageId);
    AiConversationService.MessageDetails cancelled = conversationService.cancelAssistantMessage(conversationId, messageId);
    streamingService.sendEvent(conversationId, "assistant.failed", java.util.Map.of(
        "conversationId", conversationId.toString(),
        "messageId", messageId.toString(),
        "status", "CANCELLED",
        "errorCode", "CANCELLED",
        "message", "Resposta cancelada."
    ));
    return ApiEnvelope.ok(cancelled);
  }

  @GetMapping(value = "/{conversationId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter streamConversation(@PathVariable UUID conversationId) {
    return streamingService.openStream(conversationId);
  }

  public record IntelligenceStatusResponse(
      boolean enabled,
      boolean configured,
      String model
  ) {
  }

  public record CreateConversationRequest(
      UUID planId,
      UUID cardId,
      AiConversationScopeType scopeType,
      @Size(max = 200) String title
  ) {
  }

  public record UpdateConversationRequest(
      @Size(max = 200) String title,
      AiConversationStatus status
  ) {
  }

  public record CreateMessageRequest(
      @Size(max = 12000) String content,
      Object contextSnapshot
  ) {
  }
}
