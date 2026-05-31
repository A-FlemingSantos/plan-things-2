package com.planthings.api.intelligence.blocks;

import com.planthings.api.intelligence.model.AiMessageBlockType;
import java.util.UUID;

public record ResolvedEntityReferenceBlock(
    AiMessageBlockType blockType,
    String entityType,
    UUID entityId,
    UUID parentEntityId,
    String title,
    String href,
    String payloadJson,
    String snapshotJson
) {
}
