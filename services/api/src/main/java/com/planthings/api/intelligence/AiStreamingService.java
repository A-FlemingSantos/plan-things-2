package com.planthings.api.intelligence;

import com.planthings.api.intelligence.persistence.AiConversationEntity;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class AiStreamingService {

  private static final Logger logger = LoggerFactory.getLogger(AiStreamingService.class);
  private static final long SSE_TIMEOUT_MS = 5 * 60 * 1000L;

  private final IntelligenceFeatureService intelligenceFeatureService;
  private final AiConversationService conversationService;
  private final Map<UUID, SseEmitter> activeEmitters = new ConcurrentHashMap<>();

  public AiStreamingService(
      IntelligenceFeatureService intelligenceFeatureService,
      AiConversationService conversationService
  ) {
    this.intelligenceFeatureService = intelligenceFeatureService;
    this.conversationService = conversationService;
  }

  public SseEmitter openStream(UUID conversationId) {
    intelligenceFeatureService.requireEnabled();
    AiConversationEntity conversation = conversationService.requireOwnedConversation(conversationId);

    SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
    SseEmitter previousEmitter = activeEmitters.remove(conversation.getId());
    if (previousEmitter != null) {
      previousEmitter.complete();
    }
    activeEmitters.put(conversation.getId(), emitter);

    emitter.onCompletion(() -> activeEmitters.remove(conversation.getId(), emitter));
    emitter.onTimeout(() -> activeEmitters.remove(conversation.getId(), emitter));
    emitter.onError(error -> activeEmitters.remove(conversation.getId(), emitter));

    try {
      emitter.send(SseEmitter.event()
          .name("stream.ready")
          .data(Map.of(
              "conversationId", conversation.getId().toString(),
              "message", "Canal SSE pronto. Streaming completo sera habilitado na Fase 1."
          ), MediaType.APPLICATION_JSON));
    } catch (IOException exception) {
      logger.warn("Falha ao enviar evento inicial do stream da conversa {}", conversationId, exception);
      emitter.completeWithError(exception);
    }

    return emitter;
  }
}
