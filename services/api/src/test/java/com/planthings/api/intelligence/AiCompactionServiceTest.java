package com.planthings.api.intelligence;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.intelligence.persistence.AiCompactionItemEntity;
import com.planthings.api.intelligence.persistence.AiCompactionItemRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiCompactionServiceTest {

  @Mock
  private AiCompactionItemRepository compactionItemRepository;

  private IntelligenceProperties properties;
  private AiCompactionService compactionService;

  @BeforeEach
  void setUp() {
    properties = new IntelligenceProperties();
    properties.setCompactThreshold(1000);
    compactionService = new AiCompactionService(
        compactionItemRepository,
        properties,
        new ObjectMapper()
    );
  }

  @Test
  void shouldNotLoadThresholdAuditRowsAsOpenAiInput() {
    UUID conversationId = UUID.randomUUID();

    when(compactionItemRepository.findTopByConversationIdAndCompactionModeOrderByCreatedAtDesc(
        conversationId,
        AiCompactionService.MODE_SERVER_SIDE
    )).thenReturn(Optional.empty());

    assertTrue(compactionService.loadLatestCompactionInputItems(conversationId).isEmpty());
  }

  @Test
  void shouldLoadOnlyCompactionOutputItems() {
    UUID conversationId = UUID.randomUUID();
    AiCompactionItemEntity entity = new AiCompactionItemEntity();
    entity.setCompactionMode(AiCompactionService.MODE_SERVER_SIDE);
    entity.setOpaquePayloadJson("""
        {"type":"compaction","id":"cmp_1","encrypted_content":"opaque"}
        """);

    when(compactionItemRepository.findTopByConversationIdAndCompactionModeOrderByCreatedAtDesc(
        conversationId,
        AiCompactionService.MODE_SERVER_SIDE
    )).thenReturn(Optional.of(entity));

    var items = compactionService.loadLatestCompactionInputItems(conversationId);

    assertEquals(1, items.size());
    assertEquals("compaction", items.get(0).path("type").asText());
  }

  @Test
  void shouldStoreThresholdAuditWithoutOpaquePayload() {
    UUID conversationId = UUID.randomUUID();
    UUID messageId = UUID.randomUUID();

    compactionService.recordCompactionOutput(
        conversationId,
        messageId,
        "resp_1",
        List.of(),
        "{\"input_tokens\":1500}"
    );

    ArgumentCaptor<AiCompactionItemEntity> captor = ArgumentCaptor.forClass(AiCompactionItemEntity.class);
    verify(compactionItemRepository).save(captor.capture());

    AiCompactionItemEntity saved = captor.getValue();
    assertEquals(AiCompactionService.MODE_THRESHOLD_AUDIT, saved.getCompactionMode());
    assertEquals(null, saved.getOpaquePayloadJson());
  }

  @Test
  void shouldSkipNonCompactionOutputItems() {
    UUID conversationId = UUID.randomUUID();
    UUID messageId = UUID.randomUUID();

    compactionService.recordCompactionOutput(
        conversationId,
        messageId,
        "resp_1",
        List.of("{\"type\":\"message\",\"role\":\"assistant\",\"content\":\"oi\"}"),
        null
    );

    verify(compactionItemRepository, never()).save(any());
  }
}
