package com.planthings.api.intelligence.tools;

import com.planthings.api.intelligence.IntelligenceProperties;
import com.planthings.api.intelligence.model.AiConversationScopeType;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiToolPermissionServiceTest {

  private final AiToolExecutionContext workspaceContext = new AiToolExecutionContext(
      UUID.randomUUID(),
      UUID.randomUUID(),
      UUID.randomUUID(),
      UUID.randomUUID(),
      null,
      null,
      AiConversationScopeType.WORKSPACE
  );

  private final AiToolExecutionContext planContext = new AiToolExecutionContext(
      UUID.randomUUID(),
      UUID.randomUUID(),
      UUID.randomUUID(),
      UUID.randomUUID(),
      UUID.randomUUID(),
      null,
      AiConversationScopeType.PLAN
  );

  @Test
  void shouldDisableAllToolsWhenToolsFlagIsOff() {
    IntelligenceProperties properties = new IntelligenceProperties();
    properties.setToolsEnabled(false);

    AiToolPermissionService service = new AiToolPermissionService(properties);

    assertFalse(service.isModelToolEnabled(AiCapabilityRegistry.TOOL_CONTEXT_SEARCH, workspaceContext));
    assertFalse(service.isCapabilityEnabled(AiCapabilityRegistry.WORKSPACE_GET_SUMMARY, workspaceContext));
  }

  @Test
  void shouldDisableSpecificConfiguredToolAndCapability() {
    IntelligenceProperties properties = new IntelligenceProperties();
    properties.setDisabledModelTools(Set.of(AiCapabilityRegistry.TOOL_ENTITY_GET));
    properties.setDisabledCapabilities(Set.of(AiCapabilityRegistry.FILE_SEARCH_METADATA));

    AiToolPermissionService service = new AiToolPermissionService(properties);

    assertFalse(service.isModelToolEnabled(AiCapabilityRegistry.TOOL_ENTITY_GET, workspaceContext));
    assertFalse(service.isCapabilityEnabled(AiCapabilityRegistry.FILE_SEARCH_METADATA, workspaceContext));
    assertTrue(service.isModelToolEnabled(AiCapabilityRegistry.TOOL_CONTEXT_SEARCH, workspaceContext));
  }

  @Test
  void shouldRequirePlanScopeForCardSearchCapability() {
    AiToolPermissionService service = new AiToolPermissionService(new IntelligenceProperties());

    assertFalse(service.isCapabilityEnabled(AiCapabilityRegistry.BOARD_CARD_SEARCH, workspaceContext));
    assertTrue(service.isCapabilityEnabled(AiCapabilityRegistry.BOARD_CARD_SEARCH, planContext));
  }
}
