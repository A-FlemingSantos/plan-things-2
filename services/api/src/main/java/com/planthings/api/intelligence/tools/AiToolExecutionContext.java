package com.planthings.api.intelligence.tools;

import com.planthings.api.intelligence.model.AiConversationScopeType;
import java.util.UUID;

public record AiToolExecutionContext(
    UUID conversationId,
    UUID messageId,
    UUID userId,
    UUID workspaceId,
    UUID planId,
    UUID cardId,
    AiConversationScopeType scopeType
) {
}
