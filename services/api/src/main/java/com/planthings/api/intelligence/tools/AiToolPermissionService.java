package com.planthings.api.intelligence.tools;

import com.planthings.api.intelligence.IntelligenceProperties;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AiToolPermissionService {

  private final IntelligenceProperties properties;

  public AiToolPermissionService(IntelligenceProperties properties) {
    this.properties = properties;
  }

  public boolean isModelToolEnabled(String toolName, AiToolExecutionContext context) {
    if (!properties.isToolsEnabled()) {
      return false;
    }

    String normalized = AiCapabilityRegistry.toCanonicalToolName(toolName);
    if (properties.getDisabledModelTools().stream().map(AiCapabilityRegistry::toCanonicalToolName).anyMatch(normalized::equals)) {
      return false;
    }

    if (AiCapabilityRegistry.TOOL_CONTEXT_SEARCH.equals(normalized)) {
      return isCapabilityEnabled(AiCapabilityRegistry.WORKSPACE_GET_SUMMARY, context)
          || isCapabilityEnabled(AiCapabilityRegistry.PLAN_GET, context)
          || isCapabilityEnabled(AiCapabilityRegistry.BOARD_GET, context)
          || isCapabilityEnabled(AiCapabilityRegistry.BOARD_CARD_SEARCH, context)
          || isCapabilityEnabled(AiCapabilityRegistry.FILE_SEARCH_METADATA, context);
    }

    if (AiCapabilityRegistry.TOOL_ENTITY_GET.equals(normalized)) {
      return isCapabilityEnabled(AiCapabilityRegistry.WORKSPACE_GET_SUMMARY, context)
          || isCapabilityEnabled(AiCapabilityRegistry.PLAN_GET, context)
          || isCapabilityEnabled(AiCapabilityRegistry.BOARD_GET, context)
          || isCapabilityEnabled(AiCapabilityRegistry.FILE_SEARCH_METADATA, context);
    }

    return false;
  }

  public boolean isCapabilityEnabled(String capabilityId, AiToolExecutionContext context) {
    if (!properties.isToolsEnabled()) {
      return false;
    }

    String normalized = normalize(capabilityId);
    if (properties.getDisabledCapabilities().stream().map(this::normalize).anyMatch(normalized::equals)) {
      return false;
    }

    return switch (normalized) {
      case AiCapabilityRegistry.WORKSPACE_GET_SUMMARY -> true;
      case AiCapabilityRegistry.PLAN_GET -> true;
      case AiCapabilityRegistry.BOARD_GET -> true;
      case AiCapabilityRegistry.FILE_SEARCH_METADATA -> true;
      case AiCapabilityRegistry.BOARD_CARD_SEARCH -> context.planId() != null;
      default -> false;
    };
  }

  private String normalize(String value) {
    return String.valueOf(value == null ? "" : value).trim().toLowerCase(Locale.ROOT);
  }
}
