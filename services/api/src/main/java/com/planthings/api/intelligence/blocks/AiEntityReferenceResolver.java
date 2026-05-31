package com.planthings.api.intelligence.blocks;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.board.BoardColumnEntity;
import com.planthings.api.board.BoardColumnRepository;
import com.planthings.api.files.FileEntryEntity;
import com.planthings.api.files.FileEntryRepository;
import com.planthings.api.files.FilePlanShareRepository;
import com.planthings.api.intelligence.model.AiMessageBlockType;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.plans.PlanMemberRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AiEntityReferenceResolver {

  private static final String KIND_PLAN = "plan";
  private static final String KIND_CARD = "card";
  private static final String KIND_FILE = "file";

  private final ObjectMapper objectMapper;
  private final PlanMemberRepository planMemberRepository;
  private final PlanAccessService planAccessService;
  private final BoardCardRepository boardCardRepository;
  private final BoardColumnRepository boardColumnRepository;
  private final FileEntryRepository fileEntryRepository;
  private final FilePlanShareRepository filePlanShareRepository;

  public AiEntityReferenceResolver(
      ObjectMapper objectMapper,
      PlanMemberRepository planMemberRepository,
      PlanAccessService planAccessService,
      BoardCardRepository boardCardRepository,
      BoardColumnRepository boardColumnRepository,
      FileEntryRepository fileEntryRepository,
      FilePlanShareRepository filePlanShareRepository
  ) {
    this.objectMapper = objectMapper;
    this.planMemberRepository = planMemberRepository;
    this.planAccessService = planAccessService;
    this.boardCardRepository = boardCardRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.fileEntryRepository = fileEntryRepository;
    this.filePlanShareRepository = filePlanShareRepository;
  }

  public List<ResolvedEntityReferenceBlock> resolveFromSnapshotJson(String contextSnapshotJson, UUID userId) {
    if (!StringUtils.hasText(contextSnapshotJson) || userId == null) {
      return List.of();
    }

    JsonNode snapshot = parseSnapshot(contextSnapshotJson);
    if (snapshot == null || snapshot.isNull()) {
      return List.of();
    }

    List<ResolvedEntityReferenceBlock> resolved = new ArrayList<>();
    Set<String> seen = new LinkedHashSet<>();

    JsonNode chips = snapshot.path("contextChips");
    if (chips.isArray()) {
      for (JsonNode chip : chips) {
        appendResolved(resolved, seen, resolveChip(chip, userId));
      }
    }

    appendAttachments(resolved, seen, snapshot.path("fileAttachments"), userId, false);
    appendAttachments(resolved, seen, snapshot.path("imageAttachments"), userId, true);

    return resolved;
  }

  private void appendAttachments(
      List<ResolvedEntityReferenceBlock> resolved,
      Set<String> seen,
      JsonNode attachments,
      UUID userId,
      boolean image
  ) {
    if (!attachments.isArray()) {
      return;
    }

    for (JsonNode attachment : attachments) {
      String fileIdText = attachment.path("fileId").asText(null);
      if (!StringUtils.hasText(fileIdText)) {
        continue;
      }
      UUID fileId = parseUuid(fileIdText);
      if (fileId == null) {
        continue;
      }
      String label = attachment.path("label").asText("Arquivo");
      appendResolved(resolved, seen, resolveFile(fileId, label, userId, image));
    }
  }

  private ResolvedEntityReferenceBlock resolveChip(JsonNode chip, UUID userId) {
    String kind = chip.path("kind").asText("").trim().toLowerCase();
    String type = chip.path("type").asText("").trim();
    String label = chip.path("label").asText("Referência");

    if (KIND_PLAN.equals(kind)) {
      UUID planId = parsePrefixedUuid(type, "plan-");
      return planId == null ? null : resolvePlan(planId, label, userId);
    }
    if (KIND_CARD.equals(kind)) {
      UUID cardId = parsePrefixedUuid(type, "card-");
      return cardId == null ? null : resolveCard(cardId, label, userId);
    }
    if (KIND_FILE.equals(kind)) {
      UUID fileId = parsePrefixedUuid(type, "file-");
      return fileId == null ? null : resolveFile(fileId, label, userId, false);
    }
    return null;
  }

  private ResolvedEntityReferenceBlock resolvePlan(UUID planId, String fallbackTitle, UUID userId) {
    try {
      PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
      long memberCount = planMemberRepository.findByPlanId(planId).size();

      Map<String, Object> snapshot = new LinkedHashMap<>();
      snapshot.put("subtitle", "Plano do workspace");
      snapshot.put("memberCount", memberCount);

      Map<String, Object> payload = Map.of(
          "entityId", planId.toString(),
          "href", AiEntityHrefBuilder.planBoardHref(planId)
      );

      return new ResolvedEntityReferenceBlock(
          AiMessageBlockType.PLAN_REFERENCE,
          KIND_PLAN,
          planId,
          null,
          plan.getName(),
          AiEntityHrefBuilder.planBoardHref(planId),
          writeJson(payload),
          writeJson(snapshot)
      );
    } catch (RuntimeException exception) {
      return unavailableReference(
          AiMessageBlockType.PLAN_REFERENCE,
          KIND_PLAN,
          planId,
          null,
          fallbackTitle
      );
    }
  }

  private ResolvedEntityReferenceBlock resolveCard(UUID cardId, String fallbackTitle, UUID userId) {
    try {
      BoardCardEntity card = boardCardRepository.findById(cardId)
          .orElseThrow(() -> new IllegalStateException("card missing"));
      planAccessService.requirePlanMember(card.getPlanId(), userId);

      String columnTitle = boardColumnRepository.findById(card.getColumnId())
          .map(BoardColumnEntity::getTitle)
          .orElse("");

      Map<String, Object> snapshot = new LinkedHashMap<>();
      if (StringUtils.hasText(columnTitle)) {
        snapshot.put("subtitle", columnTitle);
      }
      snapshot.put("completed", Boolean.TRUE.equals(card.getCompleted()));

      Map<String, Object> payload = new LinkedHashMap<>();
      payload.put("entityId", cardId.toString());
      payload.put("parentEntityId", card.getPlanId().toString());
      payload.put("href", AiEntityHrefBuilder.cardBoardHref(card.getPlanId(), cardId));

      return new ResolvedEntityReferenceBlock(
          AiMessageBlockType.CARD_REFERENCE,
          KIND_CARD,
          cardId,
          card.getPlanId(),
          card.getTitle(),
          AiEntityHrefBuilder.cardBoardHref(card.getPlanId(), cardId),
          writeJson(payload),
          writeJson(snapshot)
      );
    } catch (RuntimeException exception) {
      return unavailableReference(
          AiMessageBlockType.CARD_REFERENCE,
          KIND_CARD,
          cardId,
          null,
          fallbackTitle
      );
    }
  }

  private ResolvedEntityReferenceBlock resolveFile(UUID fileId, String fallbackTitle, UUID userId, boolean image) {
    try {
      FileEntryEntity file = fileEntryRepository.findById(fileId)
          .orElseThrow(() -> new IllegalStateException("file missing"));
      if (file.getDeletedAt() != null) {
        throw new IllegalStateException("file deleted");
      }
      if (!canAccessFile(file, userId)) {
        throw new IllegalStateException("file forbidden");
      }

      Map<String, Object> snapshot = new LinkedHashMap<>();
      if (StringUtils.hasText(file.getMimeType())) {
        snapshot.put("subtitle", file.getMimeType());
      } else {
        snapshot.put("subtitle", image ? "Imagem" : "Arquivo");
      }

      Map<String, Object> payload = Map.of(
          "entityId", fileId.toString(),
          "fileId", fileId.toString(),
          "href", AiEntityHrefBuilder.fileWorkspaceHref(fileId)
      );

      return new ResolvedEntityReferenceBlock(
          AiMessageBlockType.FILE_REFERENCE,
          KIND_FILE,
          fileId,
          null,
          file.getName(),
          AiEntityHrefBuilder.fileWorkspaceHref(fileId),
          writeJson(payload),
          writeJson(snapshot)
      );
    } catch (RuntimeException exception) {
      return unavailableReference(
          AiMessageBlockType.FILE_REFERENCE,
          KIND_FILE,
          fileId,
          null,
          fallbackTitle
      );
    }
  }

  private boolean canAccessFile(FileEntryEntity file, UUID userId) {
    if (Objects.equals(file.getOwnerUserId(), userId)) {
      return true;
    }
    return filePlanShareRepository.findByFileEntryId(file.getId()).stream()
        .anyMatch(share -> planMemberRepository.existsByPlanIdAndUserId(share.getPlanId(), userId));
  }

  private ResolvedEntityReferenceBlock unavailableReference(
      AiMessageBlockType blockType,
      String entityType,
      UUID entityId,
      UUID parentEntityId,
      String title
  ) {
    Map<String, Object> snapshot = Map.of(
        "unavailable", true,
        "statusLabel", "Indisponível"
    );
    Map<String, Object> payload = new LinkedHashMap<>();
    if (entityId != null) {
      payload.put("entityId", entityId.toString());
    }
    if (parentEntityId != null) {
      payload.put("parentEntityId", parentEntityId.toString());
    }

    return new ResolvedEntityReferenceBlock(
        blockType,
        entityType,
        entityId,
        parentEntityId,
        title,
        null,
        writeJson(payload),
        writeJson(snapshot)
    );
  }

  private void appendResolved(
      List<ResolvedEntityReferenceBlock> resolved,
      Set<String> seen,
      ResolvedEntityReferenceBlock block
  ) {
    if (block == null) {
      return;
    }
    String key = block.blockType().name() + ":" + (block.entityId() != null ? block.entityId() : block.title());
    if (!seen.add(key)) {
      return;
    }
    resolved.add(block);
  }

  private JsonNode parseSnapshot(String contextSnapshotJson) {
    try {
      return objectMapper.readTree(contextSnapshotJson);
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  private UUID parsePrefixedUuid(String value, String prefix) {
    if (!StringUtils.hasText(value) || !value.startsWith(prefix)) {
      return null;
    }
    return parseUuid(value.substring(prefix.length()));
  }

  private UUID parseUuid(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    try {
      return UUID.fromString(value.trim());
    } catch (IllegalArgumentException exception) {
      return null;
    }
  }

  private String writeJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Nao foi possivel serializar JSON do bloco de referencia.", exception);
    }
  }
}
