package com.planthings.api.intelligence.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.intelligence.model.AiToolCallStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiModelToolRouterTest {

  private final ObjectMapper objectMapper = new ObjectMapper();
  private AiReadOnlyCapabilityService capabilityService;
  private AiModelToolRouter router;
  private AiToolExecutionContext context;

  @BeforeEach
  void setUp() {
    capabilityService = mock(AiReadOnlyCapabilityService.class);
    router = new AiModelToolRouter(objectMapper, capabilityService);
    context = new AiToolExecutionContext(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        null,
        com.planthings.api.intelligence.model.AiConversationScopeType.PLAN
    );
  }

  @Test
  void shouldAggregateContextSearchResults() throws Exception {
    when(capabilityService.getWorkspaceSummary(context))
        .thenReturn(objectMapper.readTree("""
            {"entityType":"workspace","entityId":"w1","title":"Workspace","summary":"Resumo","payload":{}}
            """));
    when(capabilityService.searchCards(context, "login", 5))
        .thenReturn(objectMapper.readTree("""
            [{"entityType":"card","entityId":"c1","title":"Login","summary":"Card","payload":{}}]
            """));

    AiModelToolRouter.ModelToolExecution execution = router.execute(
        AiCapabilityRegistry.TOOL_CONTEXT_SEARCH,
        objectMapper.readTree("""
            {"query":"login","include":["workspace","cards"],"limit":5}
            """),
        context
    );

    assertEquals(2, execution.audits().size());
    assertEquals(2, execution.output().path("results").size());
    assertEquals("workspace", execution.output().path("results").path(0).path("entityType").asText());
    assertEquals("c1", execution.output().path("results").path(1).path("entityId").asText());
    assertTrue(execution.output().path("errors").isArray());
  }

  @Test
  void shouldReturnRecoverableErrorWhenEntityIdIsInvalid() throws Exception {
    AiModelToolRouter.ModelToolExecution execution = router.execute(
        AiCapabilityRegistry.TOOL_ENTITY_GET,
        objectMapper.readTree("""
            {"entityType":"file","entityId":"invalid-uuid"}
            """),
        context
    );

    assertTrue(execution.isFullyFailed());
    assertEquals(AiToolCallStatus.FAILED, execution.audits().get(0).status());
    assertEquals("UUID_INVALIDO", execution.audits().get(0).errorCode());
  }

  @Test
  void shouldCaptureCapabilityExceptionAsStructuredFailure() throws Exception {
    when(capabilityService.getPlan(context, UUID.fromString("11111111-1111-1111-1111-111111111111")))
        .thenThrow(new BadRequestException("PLANO_INVALIDO", "Plano invalido."));

    AiModelToolRouter.ModelToolExecution execution = router.execute(
        AiCapabilityRegistry.TOOL_ENTITY_GET,
        objectMapper.readTree("""
            {"entityType":"plan","entityId":"11111111-1111-1111-1111-111111111111"}
            """),
        context
    );

    assertTrue(execution.isFullyFailed());
    assertEquals("PLANO_INVALIDO", execution.audits().get(0).errorCode());
    assertEquals("PLANO_INVALIDO", execution.output().path("error").path("code").asText());
  }

  @Test
  void shouldAcceptOpenAiWireToolNames() throws Exception {
    when(capabilityService.getWorkspaceSummary(context))
        .thenReturn(objectMapper.readTree("""
            {"entityType":"workspace","entityId":"w1","title":"Workspace","summary":"Resumo","payload":{}}
            """));

    AiModelToolRouter.ModelToolExecution execution = router.execute(
        AiCapabilityRegistry.OPENAI_TOOL_CONTEXT_SEARCH,
        objectMapper.readTree("""
            {"query":"login","include":["workspace"],"limit":5}
            """),
        context
    );

    assertEquals(1, execution.output().path("results").size());
    assertEquals(AiToolCallStatus.COMPLETED, execution.audits().get(0).status());
  }
}
