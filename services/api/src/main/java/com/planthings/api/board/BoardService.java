package com.planthings.api.board;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.calendar.CalendarService;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ConflictException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.plans.PlanLabelEntity;
import com.planthings.api.plans.PlanLabelRepository;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.plans.PlanMemberRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BoardService {

  private final PlanAccessService planAccessService;
  private final PlanLabelRepository planLabelRepository;
  private final PlanMemberRepository planMemberRepository;
  private final BoardColumnRepository boardColumnRepository;
  private final BoardCardRepository boardCardRepository;
  private final BoardCardCommentRepository boardCardCommentRepository;
  private final BoardChecklistRepository boardChecklistRepository;
  private final BoardChecklistItemRepository boardChecklistItemRepository;
  private final BoardCardAssigneeRepository boardCardAssigneeRepository;
  private final UserRepository userRepository;
  private final AuthenticatedUserService authenticatedUserService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final CalendarService calendarService;

  public BoardService(
      PlanAccessService planAccessService,
      PlanLabelRepository planLabelRepository,
      PlanMemberRepository planMemberRepository,
      BoardColumnRepository boardColumnRepository,
      BoardCardRepository boardCardRepository,
      BoardCardCommentRepository boardCardCommentRepository,
      BoardChecklistRepository boardChecklistRepository,
      BoardChecklistItemRepository boardChecklistItemRepository,
      BoardCardAssigneeRepository boardCardAssigneeRepository,
      UserRepository userRepository,
      AuthenticatedUserService authenticatedUserService,
      BrazilDateTimeMapper brazilDateTimeMapper,
      CalendarService calendarService
  ) {
    this.planAccessService = planAccessService;
    this.planLabelRepository = planLabelRepository;
    this.planMemberRepository = planMemberRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.boardCardRepository = boardCardRepository;
    this.boardCardCommentRepository = boardCardCommentRepository;
    this.boardChecklistRepository = boardChecklistRepository;
    this.boardChecklistItemRepository = boardChecklistItemRepository;
    this.boardCardAssigneeRepository = boardCardAssigneeRepository;
    this.userRepository = userRepository;
    this.authenticatedUserService = authenticatedUserService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.calendarService = calendarService;
  }

  public BoardView getBoard(UUID planId) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    ensureDefaultLabels(planId);
    return buildBoardView(plan);
  }

  @Transactional
  public BoardView createColumn(UUID planId, String title, String color) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);

    BoardColumnEntity column = new BoardColumnEntity();
    column.setPlanId(planId);
    column.setTitle(requireText(title, "O titulo da coluna e obrigatorio."));
    column.setColor(color == null || color.isBlank() ? "#a0a0a0" : color.trim());
    column.setPositionIndex(boardColumnRepository.findByPlanIdOrderByPositionIndexAsc(planId).size());
    boardColumnRepository.save(column);
    return buildBoardView(plan);
  }

  @Transactional
  public BoardView updateColumn(UUID planId, UUID columnId, String title, String color) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    BoardColumnEntity column = requireColumn(planId, columnId);
    column.setTitle(requireText(title, "O titulo da coluna e obrigatorio."));
    if (color != null && !color.isBlank()) {
      column.setColor(color.trim());
    }
    boardColumnRepository.save(column);
    return buildBoardView(plan);
  }

  @Transactional
  public MessageResponse deleteColumn(UUID planId, UUID columnId) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    BoardColumnEntity column = requireColumn(planId, columnId);

    if (!boardCardRepository.findByColumnIdOrderByPositionIndexAsc(columnId).isEmpty()) {
      throw new ConflictException("COLUNA_COM_CARTOES", "Nao e possivel excluir uma coluna que ainda possui cartoes.");
    }

    boardColumnRepository.delete(column);
    reorder(boardColumnRepository.findByPlanIdOrderByPositionIndexAsc(planId), BoardColumnEntity::setPositionIndex);
    return new MessageResponse("Coluna excluida com sucesso.");
  }

  @Transactional
  public BoardView reorderColumns(UUID planId, List<UUID> orderedColumnIds) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    List<BoardColumnEntity> columns = boardColumnRepository.findByPlanIdOrderByPositionIndexAsc(planId);
    Map<UUID, BoardColumnEntity> byId = columns.stream().collect(Collectors.toMap(BoardColumnEntity::getId, column -> column));

    if (columns.size() != orderedColumnIds.size()) {
      throw new BadRequestException("ORDEM_INVALIDA", "A ordem enviada para as colunas esta incompleta.");
    }

    for (int i = 0; i < orderedColumnIds.size(); i++) {
      BoardColumnEntity column = byId.get(orderedColumnIds.get(i));
      if (column == null) {
        throw new BadRequestException("COLUNA_INVALIDA", "A ordem enviada contem uma coluna inexistente.");
      }
      column.setPositionIndex(i);
    }
    boardColumnRepository.saveAll(columns);
    return buildBoardView(plan);
  }

  @Transactional
  public BoardCardView createCard(UUID planId, UUID columnId, String title, String description, UUID labelId, List<UUID> assigneeIds, OffsetDateTime startAt, OffsetDateTime dueAt) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    requireColumn(planId, columnId);
    validateLabel(planId, labelId);
    validateAssignees(planId, assigneeIds);
    validateSchedule(startAt, dueAt);

    BoardCardEntity card = new BoardCardEntity();
    card.setPlanId(planId);
    card.setColumnId(columnId);
    card.setAuthorUserId(userId);
    card.setTitle(requireText(title, "O titulo do cartao e obrigatorio."));
    card.setDescription(normalizeOptional(description));
    card.setLabelId(labelId);
    card.setPositionIndex(boardCardRepository.findByColumnIdOrderByPositionIndexAsc(columnId).size());
    card.setStartAt(startAt);
    card.setDueAt(dueAt);
    boardCardRepository.save(card);

    replaceAssignees(card.getId(), assigneeIds);
    calendarService.syncCardEvent(plan, card);
    return toCardView(card);
  }

  @Transactional
  public BoardCardView updateCard(UUID planId, UUID cardId, UUID columnId, String title, String description, UUID labelId, List<UUID> assigneeIds, OffsetDateTime startAt, OffsetDateTime dueAt) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    BoardCardEntity card = requireCard(planId, cardId);
    requireColumn(planId, columnId);
    validateLabel(planId, labelId);
    validateAssignees(planId, assigneeIds);
    validateSchedule(startAt, dueAt);

    if (!Objects.equals(card.getColumnId(), columnId)) {
      UUID previousColumnId = card.getColumnId();
      card.setColumnId(columnId);
      card.setPositionIndex(boardCardRepository.findByColumnIdOrderByPositionIndexAsc(columnId).size());
      reorder(boardCardRepository.findByColumnIdOrderByPositionIndexAsc(previousColumnId), BoardCardEntity::setPositionIndex);
    }

    card.setTitle(requireText(title, "O titulo do cartao e obrigatorio."));
    card.setDescription(normalizeOptional(description));
    card.setLabelId(labelId);
    card.setStartAt(startAt);
    card.setDueAt(dueAt);
    boardCardRepository.save(card);

    replaceAssignees(card.getId(), assigneeIds);
    calendarService.syncCardEvent(plan, card);
    return toCardView(card);
  }

  @Transactional
  public BoardView moveCard(UUID planId, UUID cardId, UUID targetColumnId, int targetPosition) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    BoardCardEntity card = requireCard(planId, cardId);
    requireColumn(planId, targetColumnId);

    UUID sourceColumnId = card.getColumnId();
    List<BoardCardEntity> sourceCards = new ArrayList<>(boardCardRepository.findByColumnIdOrderByPositionIndexAsc(sourceColumnId));
    sourceCards.removeIf(item -> item.getId().equals(cardId));
    reorder(sourceCards, BoardCardEntity::setPositionIndex);

    List<BoardCardEntity> targetCards = sourceColumnId.equals(targetColumnId)
        ? sourceCards
        : new ArrayList<>(boardCardRepository.findByColumnIdOrderByPositionIndexAsc(targetColumnId));
    int safePosition = Math.max(0, Math.min(targetPosition, targetCards.size()));

    card.setColumnId(targetColumnId);
    targetCards.add(safePosition, card);
    reorder(targetCards, BoardCardEntity::setPositionIndex);

    if (!sourceColumnId.equals(targetColumnId)) {
      boardCardRepository.saveAll(sourceCards);
    }
    boardCardRepository.saveAll(targetCards);
    return buildBoardView(plan);
  }

  @Transactional
  public MessageResponse deleteCard(UUID planId, UUID cardId) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    BoardCardEntity card = requireCard(planId, cardId);
    UUID columnId = card.getColumnId();
    calendarService.removeCardEvent(cardId);
    boardCardRepository.delete(card);
    reorder(boardCardRepository.findByColumnIdOrderByPositionIndexAsc(columnId), BoardCardEntity::setPositionIndex);
    return new MessageResponse("Cartao excluido com sucesso.");
  }

  @Transactional
  public CommentView addComment(UUID planId, UUID cardId, String message) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    requireCard(planId, cardId);

    BoardCardCommentEntity comment = new BoardCardCommentEntity();
    comment.setCardId(cardId);
    comment.setAuthorUserId(userId);
    comment.setMessage(requireText(message, "O comentario e obrigatorio."));
    boardCardCommentRepository.save(comment);
    return toCommentView(comment);
  }

  @Transactional
  public ChecklistView createChecklist(UUID planId, UUID cardId, String title) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    requireCard(planId, cardId);

    BoardChecklistEntity checklist = new BoardChecklistEntity();
    checklist.setCardId(cardId);
    checklist.setTitle(requireText(title, "O titulo do checklist e obrigatorio."));
    checklist.setPositionIndex(boardChecklistRepository.findByCardIdOrderByPositionIndexAsc(cardId).size());
    boardChecklistRepository.save(checklist);
    return toChecklistView(checklist);
  }

  @Transactional
  public ChecklistItemView createChecklistItem(UUID planId, UUID checklistId, String title, UUID assigneeUserId, OffsetDateTime startAt, OffsetDateTime dueAt) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    BoardChecklistEntity checklist = requireChecklist(planId, checklistId);
    validateSchedule(startAt, dueAt);
    if (assigneeUserId != null) {
      validateAssignees(planId, List.of(assigneeUserId));
    }

    BoardChecklistItemEntity item = new BoardChecklistItemEntity();
    item.setChecklistId(checklist.getId());
    item.setTitle(requireText(title, "O titulo do item e obrigatorio."));
    item.setAssigneeUserId(assigneeUserId);
    item.setStartAt(startAt);
    item.setDueAt(dueAt);
    item.setCompleted(false);
    item.setPositionIndex(boardChecklistItemRepository.findByChecklistIdOrderByPositionIndexAsc(checklistId).size());
    boardChecklistItemRepository.save(item);
    return toChecklistItemView(item);
  }

  @Transactional
  public ChecklistItemView updateChecklistItem(UUID planId, UUID itemId, String title, Boolean completed, UUID assigneeUserId, OffsetDateTime startAt, OffsetDateTime dueAt) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    BoardChecklistItemEntity item = boardChecklistItemRepository.findById(itemId)
        .orElseThrow(() -> new NotFoundException("ITEM_NAO_ENCONTRADO", "Nao encontramos o item do checklist informado."));
    requireChecklist(planId, item.getChecklistId());
    validateSchedule(startAt, dueAt);
    if (assigneeUserId != null) {
      validateAssignees(planId, List.of(assigneeUserId));
    }

    item.setTitle(requireText(title, "O titulo do item e obrigatorio."));
    item.setCompleted(Boolean.TRUE.equals(completed));
    item.setAssigneeUserId(assigneeUserId);
    item.setStartAt(startAt);
    item.setDueAt(dueAt);
    boardChecklistItemRepository.save(item);
    return toChecklistItemView(item);
  }

  private BoardView buildBoardView(PlanEntity plan) {
    List<BoardColumnEntity> columns = boardColumnRepository.findByPlanIdOrderByPositionIndexAsc(plan.getId());
    List<BoardCardEntity> cards = boardCardRepository.findByPlanIdOrderByPositionIndexAsc(plan.getId());
    Map<UUID, List<BoardCardEntity>> cardsByColumn = cards.stream().collect(Collectors.groupingBy(BoardCardEntity::getColumnId));
    List<LabelView> labels = planLabelRepository.findByPlanIdOrderByNameAsc(plan.getId()).stream()
        .map(label -> new LabelView(label.getId(), label.getName(), label.getColor()))
        .toList();

    return new BoardView(
        plan.getId(),
        plan.getName(),
        columns.stream().map(column -> new ColumnView(
            column.getId(),
            column.getTitle(),
            column.getColor(),
            column.getPositionIndex(),
            cardsByColumn.getOrDefault(column.getId(), List.of()).stream().map(this::toCardView).toList()
        )).toList(),
        labels
    );
  }

  private BoardCardView toCardView(BoardCardEntity card) {
    UserEntity author = userRepository.findById(card.getAuthorUserId()).orElse(null);
    PlanLabelEntity label = card.getLabelId() == null ? null : planLabelRepository.findById(card.getLabelId()).orElse(null);
    List<UserSummary> assignees = boardCardAssigneeRepository.findByCardId(card.getId()).stream()
        .map(assignee -> userRepository.findById(assignee.getUserId()).orElse(null))
        .filter(Objects::nonNull)
        .map(user -> new UserSummary(user.getId(), user.getFullName(), user.getEmail()))
        .toList();
    List<CommentView> comments = boardCardCommentRepository.findByCardIdOrderByCreatedAtAsc(card.getId()).stream()
        .map(this::toCommentView)
        .toList();
    List<ChecklistView> checklists = boardChecklistRepository.findByCardIdOrderByPositionIndexAsc(card.getId()).stream()
        .map(this::toChecklistView)
        .toList();

    return new BoardCardView(
        card.getId(),
        card.getColumnId(),
        card.getTitle(),
        card.getDescription(),
        deriveCardKind(card),
        card.getPositionIndex(),
        author == null ? null : new UserSummary(author.getId(), author.getFullName(), author.getEmail()),
        label == null ? null : new LabelView(label.getId(), label.getName(), label.getColor()),
        assignees,
        comments,
        checklists,
        brazilDateTimeMapper.toDateTime(card.getStartAt()),
        brazilDateTimeMapper.toDateTime(card.getDueAt()),
        brazilDateTimeMapper.toDateTime(card.getCreatedAt()),
        brazilDateTimeMapper.toDateTime(card.getUpdatedAt())
    );
  }

  private CommentView toCommentView(BoardCardCommentEntity comment) {
    UserEntity author = userRepository.findById(comment.getAuthorUserId()).orElse(null);
    return new CommentView(
        comment.getId(),
        author == null ? "Usuario" : author.getFullName(),
        comment.getMessage(),
        brazilDateTimeMapper.toDateTime(comment.getCreatedAt())
    );
  }

  private ChecklistView toChecklistView(BoardChecklistEntity checklist) {
    List<ChecklistItemView> items = boardChecklistItemRepository.findByChecklistIdOrderByPositionIndexAsc(checklist.getId()).stream()
        .map(this::toChecklistItemView)
        .toList();
    return new ChecklistView(checklist.getId(), checklist.getTitle(), checklist.getPositionIndex(), items);
  }

  private ChecklistItemView toChecklistItemView(BoardChecklistItemEntity item) {
    UserEntity assignee = item.getAssigneeUserId() == null ? null : userRepository.findById(item.getAssigneeUserId()).orElse(null);
    return new ChecklistItemView(
        item.getId(),
        item.getTitle(),
        item.getCompleted(),
        item.getPositionIndex(),
        assignee == null ? null : new UserSummary(assignee.getId(), assignee.getFullName(), assignee.getEmail()),
        brazilDateTimeMapper.toDateTime(item.getStartAt()),
        brazilDateTimeMapper.toDateTime(item.getDueAt())
    );
  }

  private BoardColumnEntity requireColumn(UUID planId, UUID columnId) {
    return boardColumnRepository.findById(columnId)
        .filter(column -> column.getPlanId().equals(planId))
        .orElseThrow(() -> new NotFoundException("COLUNA_NAO_ENCONTRADA", "Nao encontramos a coluna informada."));
  }

  private BoardCardEntity requireCard(UUID planId, UUID cardId) {
    return boardCardRepository.findByIdAndPlanId(cardId, planId)
        .orElseThrow(() -> new NotFoundException("CARTAO_NAO_ENCONTRADO", "Nao encontramos o cartao informado."));
  }

  private BoardChecklistEntity requireChecklist(UUID planId, UUID checklistId) {
    BoardChecklistEntity checklist = boardChecklistRepository.findById(checklistId)
        .orElseThrow(() -> new NotFoundException("CHECKLIST_NAO_ENCONTRADO", "Nao encontramos o checklist informado."));
    BoardCardEntity card = boardCardRepository.findById(checklist.getCardId())
        .orElseThrow(() -> new NotFoundException("CARTAO_NAO_ENCONTRADO", "Nao encontramos o cartao vinculado ao checklist."));
    if (!card.getPlanId().equals(planId)) {
      throw new NotFoundException("CHECKLIST_NAO_ENCONTRADO", "Nao encontramos o checklist informado.");
    }
    return checklist;
  }

  private void validateLabel(UUID planId, UUID labelId) {
    if (labelId == null) {
      return;
    }
    planLabelRepository.findById(labelId)
        .filter(label -> label.getPlanId().equals(planId))
        .orElseThrow(() -> new NotFoundException("ETIQUETA_NAO_ENCONTRADA", "Nao encontramos a etiqueta informada."));
  }

  private void validateAssignees(UUID planId, List<UUID> assigneeIds) {
    if (assigneeIds == null || assigneeIds.isEmpty()) {
      return;
    }
    Set<UUID> memberIds = planMemberRepository.findByPlanId(planId).stream()
        .map(PlanMemberEntity::getUserId)
        .collect(Collectors.toSet());
    if (assigneeIds.stream().anyMatch(assigneeId -> !memberIds.contains(assigneeId))) {
      throw new BadRequestException("RESPONSAVEL_INVALIDO", "Todos os responsaveis precisam fazer parte do plano.");
    }
  }

  private void validateSchedule(OffsetDateTime startAt, OffsetDateTime dueAt) {
    if (startAt != null && dueAt != null && !dueAt.isAfter(startAt)) {
      throw new BadRequestException("CRONOGRAMA_INVALIDO", "A data final deve ser maior que a data inicial.");
    }
  }

  private void replaceAssignees(UUID cardId, List<UUID> assigneeIds) {
    boardCardAssigneeRepository.deleteByCardId(cardId);
    boardCardAssigneeRepository.flush();
    if (assigneeIds == null || assigneeIds.isEmpty()) {
      return;
    }
    List<BoardCardAssigneeEntity> assignees = assigneeIds.stream().distinct().map(assigneeId -> {
      BoardCardAssigneeEntity entity = new BoardCardAssigneeEntity();
      entity.setCardId(cardId);
      entity.setUserId(assigneeId);
      return entity;
    }).toList();
    boardCardAssigneeRepository.saveAll(assignees);
  }

  private <T> void reorder(List<T> items, BiConsumer<T, Integer> indexSetter) {
    for (int i = 0; i < items.size(); i++) {
      indexSetter.accept(items.get(i), i);
    }
    if (!items.isEmpty()) {
      if (items.get(0) instanceof BoardColumnEntity) {
        boardColumnRepository.saveAll(items.stream().map(BoardColumnEntity.class::cast).toList());
      } else {
        boardCardRepository.saveAll(items.stream().map(BoardCardEntity.class::cast).toList());
      }
    }
  }

  private String requireText(String value, String message) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException("CAMPO_OBRIGATORIO", message);
    }
    return normalized;
  }

  private String normalizeOptional(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private CardKind deriveCardKind(BoardCardEntity card) {
    if (card.getStartAt() != null && card.getDueAt() != null) {
      return CardKind.EVENTO;
    }
    if (card.getDueAt() != null) {
      return CardKind.TAREFA;
    }
    return CardKind.CARTAO;
  }

  private void ensureDefaultLabels(UUID planId) {
    if (!planLabelRepository.findByPlanIdOrderByNameAsc(planId).isEmpty()) {
      return;
    }

    createLabel(planId, "Design", "#d4aef1");
    createLabel(planId, "Engenharia", "#4290da");
    createLabel(planId, "Pesquisa", "#f5a623");
    createLabel(planId, "Marketing", "#ff6766");
    createLabel(planId, "QA", "#0f703a");
  }

  private void createLabel(UUID planId, String name, String color) {
    PlanLabelEntity label = new PlanLabelEntity();
    label.setPlanId(planId);
    label.setName(name);
    label.setColor(color);
    planLabelRepository.save(label);
  }

  public record BoardView(UUID planId, String planName, List<ColumnView> columns, List<LabelView> labels) {
  }

  public record ColumnView(UUID id, String title, String color, int position, List<BoardCardView> cards) {
  }

  public record BoardCardView(
      UUID id,
      UUID columnId,
      String title,
      String description,
      CardKind kind,
      int position,
      UserSummary author,
      LabelView label,
      List<UserSummary> assignees,
      List<CommentView> comments,
      List<ChecklistView> checklists,
      ApiDateTimeDto startAt,
      ApiDateTimeDto dueAt,
      ApiDateTimeDto createdAt,
      ApiDateTimeDto updatedAt
  ) {
  }

  public record UserSummary(UUID id, String fullName, String email) {
  }

  public record LabelView(UUID id, String name, String color) {
  }

  public record CommentView(UUID id, String authorName, String message, ApiDateTimeDto createdAt) {
  }

  public record ChecklistView(UUID id, String title, int position, List<ChecklistItemView> items) {
  }

  public record ChecklistItemView(UUID id, String title, boolean completed, int position, UserSummary assignee, ApiDateTimeDto startAt, ApiDateTimeDto dueAt) {
  }

  public record MessageResponse(String message) {
  }

  public enum CardKind {
    CARTAO,
    TAREFA,
    EVENTO
  }
}
