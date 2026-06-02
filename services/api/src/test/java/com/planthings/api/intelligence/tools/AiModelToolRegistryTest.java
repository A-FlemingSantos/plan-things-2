package com.planthings.api.intelligence.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.intelligence.model.AiConversationScopeType;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiModelToolRegistryTest {

  @Test
  void shouldExposeOnlyReadOnlyModelFacingTools() {
    AiModelToolRegistry registry = new AiModelToolRegistry(
        new ObjectMapper(),
        new AiToolPermissionService(new com.planthings.api.intelligence.IntelligenceProperties())
    );

    AiToolExecutionContext context = new AiToolExecutionContext(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        null,
        AiConversationScopeType.PLAN
    );

    List<AiModelToolRegistry.ModelToolDefinition> tools = registry.buildTools(context);

    assertEquals(2, tools.size());
    assertEquals(AiCapabilityRegistry.TOOL_CONTEXT_SEARCH, tools.get(0).name());
    assertEquals(AiCapabilityRegistry.TOOL_ENTITY_GET, tools.get(1).name());
    assertEquals(AiCapabilityRegistry.OPENAI_TOOL_CONTEXT_SEARCH, tools.get(0).openAiName());
    assertEquals(AiCapabilityRegistry.OPENAI_TOOL_ENTITY_GET, tools.get(1).openAiName());
    assertTrue(tools.get(0).toOpenAiToolJson(new ObjectMapper()).path("strict").asBoolean());
  }
}
