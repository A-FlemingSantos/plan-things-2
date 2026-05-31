package com.planthings.api.intelligence.blocks;

import com.planthings.api.intelligence.model.AiMessageBlockType;
import com.planthings.api.intelligence.persistence.AiMessageBlockEntity;
import com.planthings.api.intelligence.persistence.AiMessageBlockRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class AiMessageBlockWriter {

  private final AiMessageBlockRepository messageBlockRepository;

  public AiMessageBlockWriter(AiMessageBlockRepository messageBlockRepository) {
    this.messageBlockRepository = messageBlockRepository;
  }

  public List<AiMessageBlockEntity> replaceAssistantBlocks(
      UUID messageId,
      String markdownPayloadJson,
      List<ResolvedEntityReferenceBlock> referenceBlocks
  ) {
    messageBlockRepository.deleteByMessageId(messageId);

    List<AiMessageBlockEntity> saved = new ArrayList<>();
    int position = 0;

    AiMessageBlockEntity markdownBlock = new AiMessageBlockEntity();
    markdownBlock.setMessageId(messageId);
    markdownBlock.setBlockType(AiMessageBlockType.MARKDOWN);
    markdownBlock.setPosition(position++);
    markdownBlock.setPayloadJson(markdownPayloadJson);
    markdownBlock.setSnapshotJson(null);
    saved.add(messageBlockRepository.save(markdownBlock));

    for (ResolvedEntityReferenceBlock reference : referenceBlocks) {
      AiMessageBlockEntity entity = new AiMessageBlockEntity();
      entity.setMessageId(messageId);
      entity.setBlockType(reference.blockType());
      entity.setPosition(position++);
      entity.setEntityType(reference.entityType());
      entity.setEntityId(reference.entityId());
      entity.setTitle(reference.title());
      entity.setHref(reference.href());
      entity.setPayloadJson(reference.payloadJson());
      entity.setSnapshotJson(reference.snapshotJson());
      saved.add(messageBlockRepository.save(entity));
    }

    return saved;
  }
}
