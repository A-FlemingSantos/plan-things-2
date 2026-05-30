package com.planthings.api.intelligence;

import com.planthings.api.common.api.ApiEnvelope;
import com.planthings.api.intelligence.model.AiConversationScopeType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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

  @GetMapping("/{conversationId}/messages")
  public ApiEnvelope<List<AiConversationService.MessageDetails>> listMessages(@PathVariable UUID conversationId) {
    return ApiEnvelope.ok(conversationService.listMessages(conversationId));
  }

  @PostMapping("/{conversationId}/messages")
  public ApiEnvelope<AiConversationService.MessageAcceptedResult> createMessage(
      @PathVariable UUID conversationId,
      @Valid @RequestBody CreateMessageRequest request
  ) {
    AiConversationService.MessageAcceptedResult result = conversationService.createUserMessage(conversationId, request.content());
    responseOrchestrator.enqueueResponse(
        result.conversationId(),
        result.userMessageId(),
        result.assistantMessageId()
    );
    return ApiEnvelope.ok(result);
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

  public record CreateMessageRequest(
      @NotBlank @Size(max = 12000) String content
  ) {
  }
}
