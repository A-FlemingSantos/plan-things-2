package com.planthings.api.intelligence.tools;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.board.BoardColumnEntity;
import com.planthings.api.board.BoardColumnRepository;
import com.planthings.api.board.BoardService;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ForbiddenException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.files.FileEntryEntity;
import com.planthings.api.files.FileEntryRepository;
import com.planthings.api.files.FilePlanShareEntity;
import com.planthings.api.files.FilePlanShareRepository;
import com.planthings.api.intelligence.blocks.AiEntityHrefBuilder;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.plans.PlanService;
import com.planthings.api.workspace.WorkspaceService;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AiReadOnlyCapabilityService {

  private final ObjectMapper objectMapper;
  private final WorkspaceService workspaceService;
  private final PlanService planService;
  private final PlanAccessService planAccessService;
  private final BoardService boardService;
  private final BoardCardRepository boardCardRepository;
  private final BoardColumnRepository boardColumnRepository;
  private final FileEntryRepository fileEntryRepository;
  private final FilePlanShareRepository filePlanShareRepository;

  public AiReadOnlyCapabilityService(
      ObjectMapper objectMapper,
      WorkspaceService workspaceService,
      PlanService planService,
      PlanAccessService planAccessService,
      BoardService boardService,
      BoardCardRepository boardCardRepository,
      BoardColumnRepository boardColumnRepository,
      FileEntryRepository fileEntryRepository,
      FilePlanShareRepository filePlanShareRepository
  ) {
    this.objectMapper = objectMapper;
    this.workspaceService = workspaceService;
    this.planService = planService;
    this.planAccessService = planAccessService;
    this.boardService = boardService;
    this.boardCardRepository = boardCardRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.fileEntryRepository = fileEntryRepository;
    this.filePlanShareRepository = filePlanShareRepository;
  }

  public JsonNode getWorkspaceSummary(AiToolExecutionContext context) {
    WorkspaceService.WorkspaceDashboard workspace = workspaceService.getCurrentWorkspace();
    if (!workspace.id().equals(context.workspaceId())) {
      throw new ForbiddenException("WORKSPACE_FORA_DO_ESCOPO", "O workspace solicitado nao pertence a esta conversa.");
    }

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("subscriptionPlan", workspace.subscriptionPlan());
    payload.put("storageUsedBytes", workspace.storageUsedBytes());
    payload.put("storageQuotaBytes", workspace.storageQuotaBytes());
    payload.put("plansCount", workspace.plansCount());
    payload.put("personalFilesCount", workspace.personalFilesCount());
    payload.put("standaloneEventsCount", workspace.standaloneEventsCount());
    payload.put("owner", workspace.owner());

    return normalizedEntity(
        "workspace",
        workspace.id(),
        workspace.name(),
        "Workspace com %d planos, %d arquivos pessoais e %d eventos.".formatted(
            workspace.plansCount(),
            workspace.personalFilesCount(),
            workspace.standaloneEventsCount()
        ),
        "/workspace",
        null,
        Map.of(
            "plansCount", workspace.plansCount(),
            "personalFilesCount", workspace.personalFilesCount(),
            "standaloneEventsCount", workspace.standaloneEventsCount()
        ),
        payload
    );
  }

  public JsonNode getPlan(AiToolExecutionContext context, UUID requestedPlanId) {
    UUID planId = resolvePlanId(context, requestedPlanId, "Plano");
    requirePlanInScope(planId, context);
    PlanService.PlanDetails details = planService.getPlan(planId);

    PlanService.PlanSummary summary = details.plan();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("plan", summary);
    payload.put("members", details.members());
    payload.put("labels", details.labels());

    return normalizedEntity(
        "plan",
        summary.id(),
        summary.name(),
        "Plano com %d membros, %d cards e %d labels.".formatted(
            summary.memberCount(),
            summary.taskCount(),
            details.labels().size()
        ),
        AiEntityHrefBuilder.planBoardHref(summary.id()),
        null,
        Map.of(
            "memberCount", summary.memberCount(),
            "taskCount", summary.taskCount(),
            "labelCount", details.labels().size()
        ),
        payload
    );
  }

  public JsonNode getBoard(AiToolExecutionContext context, UUID requestedPlanId) {
    UUID planId = resolvePlanId(context, requestedPlanId, "Board");
    requirePlanInScope(planId, context);
    BoardService.BoardView board = boardService.getBoard(planId);

    long totalCards = board.columns().stream().mapToLong(column -> column.cards().size()).sum();
    ArrayNode columns = objectMapper.createArrayNode();
    for (BoardService.ColumnView column : board.columns()) {
      ObjectNode columnNode = columns.addObject();
      columnNode.put("id", column.id().toString());
      columnNode.put("title", column.title());
      columnNode.put("color", String.valueOf(column.color() == null ? "" : column.color()));
      columnNode.put("cardCount", column.cards().size());

      ArrayNode cards = columnNode.putArray("cards");
      for (BoardService.BoardCardView card : column.cards().stream().limit(10).toList()) {
        ObjectNode cardNode = cards.addObject();
        cardNode.put("id", card.id().toString());
        cardNode.put("title", card.title());
        cardNode.put("completed", card.completed());
        if (card.dueAt() != null) {
          cardNode.put("dueAt", objectMapper.valueToTree(card.dueAt()).toString());
        }
      }
    }

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("planId", board.planId());
    payload.put("planName", board.planName());
    payload.put("columnCount", board.columns().size());
    payload.put("totalCards", totalCards);
    payload.put("inboxCount", board.inboxItems().size());
    payload.put("labelCount", board.labels().size());
    payload.put("columns", columns);
    payload.put("labels", board.labels());
    payload.put("inboxItems", board.inboxItems());

    return normalizedEntity(
        "board",
        board.planId(),
        board.planName(),
        "Board com %d colunas, %d cards e %d itens na inbox.".formatted(
            board.columns().size(),
            totalCards,
            board.inboxItems().size()
        ),
        AiEntityHrefBuilder.planBoardHref(board.planId()),
        null,
        Map.of(
            "columnCount", board.columns().size(),
            "totalCards", totalCards,
            "inboxCount", board.inboxItems().size()
        ),
        payload
    );
  }

  public JsonNode searchCards(AiToolExecutionContext context, String query, int limit) {
    if (context.planId() == null) {
      throw new BadRequestException("BUSCA_DE_CARTOES_FORA_DO_ESCOPO", "A conversa atual nao possui um plano em foco para buscar cards.");
    }

    String normalizedQuery = normalizeQuery(query);
    requirePlanInScope(context.planId(), context);

    List<BoardCardEntity> cards = new ArrayList<>(boardCardRepository.searchByPlanId(
        context.planId(),
        normalizedQuery,
        PageRequest.of(0, Math.max(1, Math.min(limit, 12)))
    ));

    if (context.cardId() != null) {
      cards.removeIf(card -> !context.cardId().equals(card.getId()));
    }

    Map<UUID, String> columnTitles = boardColumnRepository.findByPlanIdOrderByPositionIndexAsc(context.planId()).stream()
        .collect(Collectors.toMap(BoardColumnEntity::getId, BoardColumnEntity::getTitle, (left, right) -> left, LinkedHashMap::new));

    ArrayNode results = objectMapper.createArrayNode();
    for (BoardCardEntity card : cards.stream().limit(limit).toList()) {
      ObjectNode node = results.addObject();
      node.put("entityType", "card");
      node.put("entityId", card.getId().toString());
      node.put("parentEntityId", card.getPlanId().toString());
      node.put("title", card.getTitle());
      node.put("summary", buildCardSummary(card, columnTitles.get(card.getColumnId())));
      node.put("href", AiEntityHrefBuilder.cardBoardHref(card.getPlanId(), card.getId()));

      ObjectNode snapshot = node.putObject("snapshot");
      if (StringUtils.hasText(columnTitles.get(card.getColumnId()))) {
        snapshot.put("column", columnTitles.get(card.getColumnId()));
      }
      snapshot.put("completed", Boolean.TRUE.equals(card.getCompleted()));
      if (card.getDueAt() != null) {
        snapshot.put("dueAt", card.getDueAt().toString());
      }
    }
    return results;
  }

  public JsonNode searchFileMetadata(AiToolExecutionContext context, String query, int limit) {
    String normalizedQuery = normalizeQuery(query);
    List<FileEntryEntity> files;

    if (context.planId() != null) {
      requirePlanInScope(context.planId(), context);
      List<UUID> fileIds = filePlanShareRepository.findByPlanId(context.planId()).stream()
          .map(FilePlanShareEntity::getFileEntryId)
          .distinct()
          .toList();
      if (fileIds.isEmpty()) {
        return objectMapper.createArrayNode();
      }
      files = fileEntryRepository.searchFilesByIds(fileIds, normalizedQuery, PageRequest.of(0, Math.max(1, Math.min(limit, 12))));
    } else {
      files = fileEntryRepository.searchFilesByWorkspaceId(
          context.workspaceId(),
          context.userId(),
          normalizedQuery,
          PageRequest.of(0, Math.max(1, Math.min(limit, 12)))
      );
    }

    ArrayNode results = objectMapper.createArrayNode();
    for (FileEntryEntity file : files.stream().limit(limit).toList()) {
      ObjectNode node = results.addObject();
      node.put("entityType", "file");
      node.put("entityId", file.getId().toString());
      node.put("title", file.getName());
      node.put("summary", buildFileSummary(file));
      node.put("href", AiEntityHrefBuilder.fileWorkspaceHref(file.getId()));

      ObjectNode snapshot = node.putObject("snapshot");
      snapshot.put("mimeType", String.valueOf(file.getMimeType() == null ? "" : file.getMimeType()));
      if (file.getSizeBytes() != null) {
        snapshot.put("sizeBytes", file.getSizeBytes());
      }
    }
    return results;
  }

  public JsonNode getFile(AiToolExecutionContext context, UUID fileId) {
    FileEntryEntity file = fileEntryRepository.findById(fileId)
        .orElseThrow(() -> new NotFoundException("ARQUIVO_NAO_ENCONTRADO", "Nao encontramos o arquivo informado."));

    if (!file.getWorkspaceId().equals(context.workspaceId())) {
      throw new ForbiddenException("ARQUIVO_FORA_DO_ESCOPO", "O arquivo informado esta fora do escopo desta conversa.");
    }
    if (!canAccessFile(file, context.userId())) {
      throw new ForbiddenException("ACESSO_AO_ARQUIVO_NEGADO", "Voce nao tem acesso a este arquivo.");
    }
    if (context.planId() != null && !isFileSharedToPlan(file.getId(), context.planId())) {
      throw new ForbiddenException("ARQUIVO_FORA_DO_ESCOPO", "O arquivo informado nao pertence ao plano em foco da conversa.");
    }

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", file.getId());
    payload.put("name", file.getName());
    payload.put("mimeType", file.getMimeType());
    payload.put("sizeBytes", file.getSizeBytes());
    payload.put("updatedAt", file.getUpdatedAt());
    payload.put("createdAt", file.getCreatedAt());

    return normalizedEntity(
        "file",
        file.getId(),
        file.getName(),
        buildFileSummary(file),
        AiEntityHrefBuilder.fileWorkspaceHref(file.getId()),
        null,
        Map.of(
            "mimeType", String.valueOf(file.getMimeType() == null ? "" : file.getMimeType()),
            "sizeBytes", file.getSizeBytes() == null ? 0L : file.getSizeBytes()
        ),
        payload
    );
  }

  private UUID resolvePlanId(AiToolExecutionContext context, UUID requestedPlanId, String label) {
    if (requestedPlanId != null) {
      return requestedPlanId;
    }
    if (context.planId() != null) {
      return context.planId();
    }
    throw new BadRequestException("PLANO_OBRIGATORIO", label + " exige um planId valido dentro do escopo autorizado.");
  }

  private PlanEntity requirePlanInScope(UUID planId, AiToolExecutionContext context) {
    PlanEntity plan = planAccessService.requirePlanMember(planId, context.userId());
    if (!plan.getWorkspaceId().equals(context.workspaceId())) {
      throw new ForbiddenException("PLANO_FORA_DO_ESCOPO", "O plano informado esta fora do workspace desta conversa.");
    }
    if (context.planId() != null && context.cardId() != null && !context.planId().equals(planId)) {
      throw new ForbiddenException("PLANO_FORA_DO_ESCOPO", "A conversa em escopo de cartao nao pode consultar outro plano.");
    }
    return plan;
  }

  private boolean canAccessFile(FileEntryEntity file, UUID userId) {
    if (Objects.equals(file.getOwnerUserId(), userId)) {
      return true;
    }
    return filePlanShareRepository.findByFileEntryId(file.getId()).stream()
        .anyMatch(share -> {
          try {
            planAccessService.requirePlanMember(share.getPlanId(), userId);
            return true;
          } catch (RuntimeException exception) {
            return false;
          }
        });
  }

  private boolean isFileSharedToPlan(UUID fileId, UUID planId) {
    return filePlanShareRepository.findByPlanIdAndFileEntryId(planId, fileId).isPresent();
  }

  private String normalizeQuery(String query) {
    return String.valueOf(query == null ? "" : query).trim();
  }

  private String buildCardSummary(BoardCardEntity card, String columnTitle) {
    List<String> parts = new ArrayList<>();
    if (StringUtils.hasText(columnTitle)) {
      parts.add("Coluna: " + columnTitle);
    }
    parts.add(Boolean.TRUE.equals(card.getCompleted()) ? "Concluido" : "Pendente");
    if (card.getDueAt() != null) {
      parts.add("Entrega: " + card.getDueAt());
    }
    return String.join(" • ", parts);
  }

  private String buildFileSummary(FileEntryEntity file) {
    List<String> parts = new ArrayList<>();
    if (StringUtils.hasText(file.getMimeType())) {
      parts.add(file.getMimeType());
    }
    if (file.getSizeBytes() != null) {
      parts.add(file.getSizeBytes() + " bytes");
    }
    return parts.isEmpty() ? "Arquivo do workspace." : String.join(" • ", parts);
  }

  private JsonNode normalizedEntity(
      String entityType,
      UUID entityId,
      String title,
      String summary,
      String href,
      UUID parentEntityId,
      Map<String, Object> snapshot,
      Map<String, Object> payload
  ) {
    ObjectNode node = objectMapper.createObjectNode();
    node.put("entityType", entityType);
    node.put("entityId", entityId.toString());
    node.put("title", title);
    node.put("summary", summary);
    if (StringUtils.hasText(href)) {
      node.put("href", href);
    }
    if (parentEntityId != null) {
      node.put("parentEntityId", parentEntityId.toString());
    }
    if (snapshot != null && !snapshot.isEmpty()) {
      node.set("snapshot", objectMapper.valueToTree(snapshot));
    }
    node.set("payload", objectMapper.valueToTree(payload == null ? Map.of() : payload));
    return node;
  }
}
