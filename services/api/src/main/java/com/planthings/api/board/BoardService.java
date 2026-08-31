package com.planthings.api.board;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.avatar.AvatarImageService;
import com.planthings.api.avatar.AvatarOwnerType;
import com.planthings.api.calendar.CalendarService;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ConflictException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.files.CardAttachmentEntity;
import com.planthings.api.files.CardAttachmentRepository;
import com.planthings.api.files.FileEntryEntity;
import com.planthings.api.files.FileEntryRepository;
import com.planthings.api.files.FileEntryType;
import com.planthings.api.github.BoardCardGitHubLinkRepository;
import com.planthings.api.github.GitHubLinkMapper;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.plans.PlanLabelEntity;
import com.planthings.api.plans.PlanLabelRepository;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.plans.PlanMemberRepository;
import com.planthings.api.plans.PlanMemberRole;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.BiConsumer;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class BoardService {

  private final PlanAccessService planAccessService;
  private final PlanLabelRepository planLabelRepository;
  private final PlanMemberRepository planMemberRepository;
  private final BoardColumnRepository boardColumnRepository;
  private final BoardColumnGroupRepository boardColumnGroupRepository;
  private final BoardColumnViewPreferenceRepository boardColumnViewPreferenceRepository;
  private final BoardCardRepository boardCardRepository;
  private final BoardCardCommentRepository boardCardCommentRepository;
  private final BoardChecklistRepository boardChecklistRepository;
  private final BoardChecklistItemRepository boardChecklistItemRepository;
  private final BoardCardAssigneeRepository boardCardAssigneeRepository;
  private final BoardCardInboxDeliveryRepository boardCardInboxDeliveryRepository;
  private final BoardCardInboxDeliveryRecipientRepository boardCardInboxDeliveryRecipientRepository;
  private final CardAttachmentRepository cardAttachmentRepository;
  private final FileEntryRepository fileEntryRepository;
  private final UserRepository userRepository;
  private final AuthenticatedUserService authenticatedUserService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final CalendarService calendarService;
  private final BoardCardInboxEmailSender boardCardInboxEmailSender;
  private final AvatarImageService avatarImageService;
  private final BoardCardGitHubLinkRepository boardCardGitHubLinkRepository;
  private final GitHubLinkMapper gitHubLinkMapper;

  public BoardService(
      PlanAccessService planAccessService,
      PlanLabelRepository planLabelRepository,
      PlanMemberRepository planMemberRepository,
      BoardColumnRepository boardColumnRepository,
      BoardColumnGroupRepository boardColumnGroupRepository,
      BoardColumnViewPreferenceRepository boardColumnViewPreferenceRepository,
      BoardCardRepository boardCardRepository,
      BoardCardCommentRepository boardCardCommentRepository,
      BoardChecklistRepository boardChecklistRepository,
      BoardChecklistItemRepository boardChecklistItemRepository,
      BoardCardAssigneeRepository boardCardAssigneeRepository,
      BoardCardInboxDeliveryRepository boardCardInboxDeliveryRepository,
      BoardCardInboxDeliveryRecipientRepository boardCardInboxDeliveryRecipientRepository,
      CardAttachmentRepository cardAttachmentRepository,
      FileEntryRepository fileEntryRepository,
      UserRepository userRepository,
      AuthenticatedUserService authenticatedUserService,
      BrazilDateTimeMapper brazilDateTimeMapper,
      CalendarService calendarService,
      BoardCardInboxEmailSender boardCardInboxEmailSender,
      AvatarImageService avatarImageService,
      BoardCardGitHubLinkRepository boardCardGitHubLinkRepository,
      GitHubLinkMapper gitHubLinkMapper
  ) {
    this.planAccessService = planAccessService;
    this.planLabelRepository = planLabelRepository;
    this.planMemberRepository = planMemberRepository;
    this.boardColumnRepository = boardColumnRepository;
    this.boardColumnGroupRepository = boardColumnGroupRepository;
    this.boardColumnViewPreferenceRepository = boardColumnViewPreferenceRepository;
    this.boardCardRepository = boardCardRepository;
    this.boardCardCommentRepository = boardCardCommentRepository;
    this.boardChecklistRepository = boardChecklistRepository;
    this.boardChecklistItemRepository = boardChecklistItemRepository;
    this.boardCardAssigneeRepository = boardCardAssigneeRepository;
    this.boardCardInboxDeliveryRepository = boardCardInboxDeliveryRepository;
    this.boardCardInboxDeliveryRecipientRepository = boardCardInboxDeliveryRecipientRepository;
    this.cardAttachmentRepository = cardAttachmentRepository;
    this.fileEntryRepository = fileEntryRepository;
    this.userRepository = userRepository;
    this.authenticatedUserService = authenticatedUserService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.calendarService = calendarService;
    this.boardCardInboxEmailSender = boardCardInboxEmailSender;
    this.avatarImageService = avatarImageService;
    this.boardCardGitHubLinkRepository = boardCardGitHubLinkRepository;
    this.gitHubLinkMapper = gitHubLinkMapper;
  }

  public BoardView getBoard(UUID planId) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    ensureDefaultLabels(planId);
    return buildBoardView(plan, userId);
  }

  @Transactional
  public CompactColumnsPreferenceView updateCompactColumns(UUID planId, List<UUID> columnIds) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);

    Set<UUID> requestedColumnIds = new LinkedHashSet<>(columnIds == null ? List.of() : columnIds);
    Set<UUID> planColumnIds = boardColumnRepository.findByPlanIdOrderByPositionIndexAsc(planId).stream()
        .map(BoardColumnEntity::getId)
        .collect(Collectors.toSet());

    if (!planColumnIds.containsAll(requestedColumnIds)) {
      throw new BadRequestException("COLUNA_INVALIDA", "A preferencia contem uma coluna inexistente neste plano.");
    }

    boardColumnViewPreferenceRepository.deleteByUserIdAndPlanId(userId, planId);
    if (!requestedColumnIds.isEmpty()) {
      boardColumnViewPreferenceRepository.saveAll(requestedColumnIds.stream()
          .map(columnId -> {
            BoardColumnViewPreferenceEntity preference = new BoardColumnViewPreferenceEntity();
            preference.setUserId(userId);
            preference.setPlanId(planId);
            preference.setColumnId(columnId);
            return preference;
          })
          .toList());
    }

    return new CompactColumnsPreferenceView(List.copyOf(requestedColumnIds));
  }

  @Transactional
  public BoardView createColumn(UUID planId, String title, String color, String status) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);

    BoardColumnEntity column = new BoardColumnEntity();
    column.setPlanId(planId);
    column.setTitle(requireText(title, "O titulo da coluna e obrigatorio."));
    column.setColor(normalizeColumnColor(color));
    column.setStatus(normalizeColumnStatus(status));
    column.setPositionIndex(boardColumnRepository.findByPlanIdOrderByPositionIndexAsc(planId).size());
    boardColumnRepository.save(column);
    return buildBoardView(plan, userId);
  }

  @Transactional
  public BoardView updateColumn(UUID planId, UUID columnId, String title, String color, String status) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    BoardColumnEntity column = requireColumn(planId, columnId);
    column.setTitle(requireText(title, "O titulo da coluna e obrigatorio."));
    column.setColor(normalizeColumnColor(color));
    if (status != null) {
      column.setStatus(normalizeColumnStatus(status));
    }
    boardColumnRepository.save(column);
    return buildBoardView(plan, userId);
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
    return buildBoardView(plan, userId);
  }

  @Transactional
  public BoardView createColumnGroup(UUID planId, UUID columnId, UUID startCardId, String title, Boolean collapsed) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    BoardColumnEntity column = requireColumn(planId, columnId);
    BoardCardEntity startCard = requireCard(planId, startCardId);
    if (!startCard.getColumnId().equals(column.getId())) {
      throw new BadRequestException("AGRUPAMENTO_INVALIDO", "O cartao inicial precisa pertencer a esta coluna.");
    }

    List<BoardCardEntity> columnCards = boardCardRepository.findByColumnIdOrderByPositionIndexAsc(columnId);
    List<BoardColumnGroupEntity> existingGroups = boardColumnGroupRepository.findByColumnId(columnId);
    if (isCardInsideExistingGroup(columnCards, existingGroups, startCardId)) {
      throw new ConflictException("AGRUPAMENTO_ANINHADO", "Nao e possivel criar um agrupamento dentro de outro.");
    }

    BoardColumnGroupEntity group = new BoardColumnGroupEntity();
    group.setPlanId(planId);
    group.setColumnId(columnId);
    group.setTitle(normalizeGroupTitle(title));
    group.setStartCardId(startCardId);
    group.setEndCardId(resolveGroupEndCardId(columnCards, existingGroups, startCardId));
    group.setCollapsed(Boolean.TRUE.equals(collapsed));
    boardColumnGroupRepository.save(group);
    return buildBoardView(plan, userId);
  }

  @Transactional
  public ColumnGroupView updateColumnGroup(UUID planId, UUID groupId, String title, Boolean collapsed) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    BoardColumnGroupEntity group = requireColumnGroup(planId, groupId);
    if (title != null) {
      group.setTitle(normalizeGroupTitle(title));
    }
    if (collapsed != null) {
      group.setCollapsed(collapsed);
    }
    boardColumnGroupRepository.save(group);
    return toColumnGroupView(group);
  }

  @Transactional
  public BoardView deleteColumnGroup(UUID planId, UUID groupId) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    BoardColumnGroupEntity group = requireColumnGroup(planId, groupId);
    boardColumnGroupRepository.delete(group);
    return buildBoardView(plan, userId);
  }

  @Transactional
  public BoardCardView createCard(UUID planId, UUID columnId, String title, String description, UUID labelId, List<UUID> assigneeIds, Boolean completed, Boolean starred, OffsetDateTime startAt, OffsetDateTime dueAt) {
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
    card.setCompleted(Boolean.TRUE.equals(completed));
    card.setStarred(Boolean.TRUE.equals(starred));
    card.setStartAt(startAt);
    card.setDueAt(dueAt);
    boardCardRepository.save(card);

    replaceAssignees(card.getId(), assigneeIds);
    calendarService.syncCardEvent(plan, card);
    return toCardView(card, userId, planAccessService.requireMemberRole(planId, userId));
  }

  @Transactional
  public BoardCardView updateCard(UUID planId, UUID cardId, UUID columnId, String title, String description, UUID labelId, List<UUID> assigneeIds, Boolean completed, Boolean starred, OffsetDateTime startAt, OffsetDateTime dueAt) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    BoardCardEntity card = requireCard(planId, cardId);
    List<UUID> previousAssigneeIds = normalizeAssigneeIds(
        boardCardAssigneeRepository.findByCardId(cardId).stream()
            .map(BoardCardAssigneeEntity::getUserId)
            .toList()
    );
    List<UUID> nextAssigneeIds = normalizeAssigneeIds(assigneeIds);
    requireColumn(planId, columnId);
    validateLabel(planId, labelId);
    validateAssignees(planId, nextAssigneeIds);
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
    if (completed != null) {
      card.setCompleted(Boolean.TRUE.equals(completed));
    }
    if (starred != null) {
      card.setStarred(Boolean.TRUE.equals(starred));
    }
    card.setStartAt(startAt);
    card.setDueAt(dueAt);
    boardCardRepository.save(card);

    replaceAssignees(card.getId(), nextAssigneeIds);
    appendAssigneeActivity(card.getId(), userId, previousAssigneeIds, nextAssigneeIds);
    calendarService.syncCardEvent(plan, card);
    return toCardView(card, userId, planAccessService.requireMemberRole(planId, userId));
  }

  @Transactional
  public BoardView moveCard(UUID planId, UUID cardId, UUID targetColumnId, int targetPosition) {
    UUID userId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, userId);
    BoardCardEntity card = requireCard(planId, cardId);
    requireColumn(planId, targetColumnId);

    UUID sourceColumnId = card.getColumnId();
    List<BoardCardEntity> originalSourceCards = new ArrayList<>(boardCardRepository.findByColumnIdOrderByPositionIndexAsc(sourceColumnId));
    List<BoardCardEntity> sourceCards = new ArrayList<>(originalSourceCards);
    sourceCards.removeIf(item -> item.getId().equals(cardId));
    if (!sourceColumnId.equals(targetColumnId)) {
      reassignGroupsAfterRemovingCard(sourceColumnId, cardId, originalSourceCards, sourceCards);
    }
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
    return buildBoardView(plan, userId);
  }

  @Transactional
  public MessageResponse deleteCard(UUID planId, UUID cardId) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    BoardCardEntity card = requireCard(planId, cardId);
    UUID columnId = card.getColumnId();
    List<BoardCardEntity> originalCards = new ArrayList<>(boardCardRepository.findByColumnIdOrderByPositionIndexAsc(columnId));
    List<BoardCardEntity> remainingCards = originalCards.stream()
        .filter(item -> !item.getId().equals(cardId))
        .toList();
    reassignGroupsAfterRemovingCard(columnId, cardId, originalCards, remainingCards);
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

    BoardCardCommentEntity comment = createComment(cardId, userId, requireText(message, "O comentario e obrigatorio."), BoardCommentKind.USER_COMMENT);
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
  public MessageResponse deleteChecklist(UUID planId, UUID checklistId) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    BoardChecklistEntity checklist = requireChecklist(planId, checklistId);
    UUID cardId = checklist.getCardId();

    boardChecklistItemRepository.deleteAll(boardChecklistItemRepository.findByChecklistIdOrderByPositionIndexAsc(checklistId));
    boardChecklistRepository.delete(checklist);
    reorder(boardChecklistRepository.findByCardIdOrderByPositionIndexAsc(cardId), BoardChecklistEntity::setPositionIndex);
    return new MessageResponse("Checklist excluida com sucesso.");
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

  @Transactional
  public InboxDeliveryResponse sendCardToInbox(UUID planId, UUID cardId, List<UUID> recipientUserIds) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    PlanEntity plan = planAccessService.requirePlanMember(planId, currentUser.getId());
    BoardCardEntity card = requireCard(planId, cardId);
    List<UserEntity> recipients = resolveInboxRecipients(planId, cardId, recipientUserIds);
    if (recipients.isEmpty()) {
      throw new BadRequestException("CARTAO_SEM_DESTINATARIOS", "Escolha ao menos um membro para receber este cartao por e-mail.");
    }
    if (recipientUserIds != null && !recipientUserIds.isEmpty()) {
      addAssignees(cardId, recipients.stream().map(UserEntity::getId).toList());
    }

    BoardCardInboxEmailSender.Delivery delivery = boardCardInboxEmailSender.sendCard(
        currentUser,
        plan,
        card,
        deriveCardKind(card),
        recipients
    );
    InboxItemView inboxItem = recordInboxDelivery(plan, card, currentUser, delivery, recipients);
    return new InboxDeliveryResponse(delivery.emailSent(), delivery.sentFrom(), delivery.sentTo(), delivery.messageId(), delivery.threadId(), inboxItem);
  }

  @Transactional
  public MessageResponse clearInboxDeliveries(UUID planId) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    List<UUID> deliveryIds = boardCardInboxDeliveryRepository.findByPlanId(planId).stream()
        .map(BoardCardInboxDeliveryEntity::getId)
        .toList();
    if (!deliveryIds.isEmpty()) {
      boardCardInboxDeliveryRecipientRepository.deleteByDeliveryIdIn(deliveryIds);
      boardCardInboxDeliveryRepository.deleteByPlanId(planId);
    }
    return new MessageResponse("Historico da Inbox limpo com sucesso.");
  }

  private BoardView buildBoardView(PlanEntity plan, UUID currentUserId) {
    List<BoardColumnEntity> columns = boardColumnRepository.findByPlanIdOrderByPositionIndexAsc(plan.getId());
    List<BoardCardEntity> cards = boardCardRepository.findByPlanIdOrderByPositionIndexAsc(plan.getId());
    Map<UUID, List<BoardCardEntity>> cardsByColumn = cards.stream().collect(Collectors.groupingBy(BoardCardEntity::getColumnId));
    Map<UUID, List<BoardColumnGroupEntity>> groupsByColumn = boardColumnGroupRepository.findByPlanId(plan.getId()).stream()
        .collect(Collectors.groupingBy(BoardColumnGroupEntity::getColumnId));
    List<UUID> compactColumnIds = boardColumnViewPreferenceRepository.findByUserIdAndPlanId(currentUserId, plan.getId())
        .stream()
        .map(BoardColumnViewPreferenceEntity::getColumnId)
        .toList();
    PlanMemberRole currentRole = planAccessService.requireMemberRole(plan.getId(), currentUserId);
    List<LabelView> labels = planLabelRepository.findByPlanIdOrderByNameAsc(plan.getId()).stream()
        .map(label -> new LabelView(label.getId(), label.getName(), label.getColor()))
        .toList();

    return new BoardView(
        plan.getId(),
        plan.getName(),
        columns.stream().map(column -> {
          List<BoardCardEntity> columnCards = cardsByColumn.getOrDefault(column.getId(), List.of());
          return new ColumnView(
              column.getId(),
              column.getTitle(),
              column.getColor(),
              column.getStatus(),
              column.getPositionIndex(),
              columnCards.stream()
                  .map(card -> toCardView(card, currentUserId, currentRole))
                  .toList(),
              toGroupViews(groupsByColumn.getOrDefault(column.getId(), List.of()), columnCards)
          );
        }).toList(),
        labels,
        buildInboxItems(plan.getId()),
        compactColumnIds
    );
  }

  private InboxItemView recordInboxDelivery(
      PlanEntity plan,
      BoardCardEntity card,
      UserEntity sender,
      BoardCardInboxEmailSender.Delivery delivery,
      List<UserEntity> recipients
  ) {
    BoardCardInboxDeliveryEntity deliveryEntity = new BoardCardInboxDeliveryEntity();
    deliveryEntity.setPlanId(plan.getId());
    deliveryEntity.setCardId(card.getId());
    deliveryEntity.setSentByUserId(sender.getId());
    deliveryEntity.setSentFrom(delivery.sentFrom());
    deliveryEntity.setMessageId(delivery.messageId());
    deliveryEntity.setThreadId(delivery.threadId());
    boardCardInboxDeliveryRepository.save(deliveryEntity);

    List<BoardCardInboxDeliveryRecipientEntity> recipientEntities = recipients.stream()
        .map(recipient -> {
          BoardCardInboxDeliveryRecipientEntity entity = new BoardCardInboxDeliveryRecipientEntity();
          entity.setDeliveryId(deliveryEntity.getId());
          entity.setUserId(recipient.getId());
          entity.setEmail(recipient.getEmail());
          return entity;
        })
        .toList();
    boardCardInboxDeliveryRecipientRepository.saveAll(recipientEntities);

    return toInboxItemView(
        deliveryEntity,
        card,
        sender,
        recipientEntities,
        recipients.stream().collect(Collectors.toMap(UserEntity::getId, user -> user))
    );
  }

  private List<InboxItemView> buildInboxItems(UUID planId) {
    List<BoardCardInboxDeliveryEntity> deliveries = boardCardInboxDeliveryRepository.findTop50ByPlanIdOrderByCreatedAtDesc(planId);
    if (deliveries.isEmpty()) {
      return List.of();
    }

    List<UUID> deliveryIds = deliveries.stream().map(BoardCardInboxDeliveryEntity::getId).toList();
    Map<UUID, List<BoardCardInboxDeliveryRecipientEntity>> recipientsByDeliveryId = boardCardInboxDeliveryRecipientRepository
        .findByDeliveryIdIn(deliveryIds)
        .stream()
        .collect(Collectors.groupingBy(BoardCardInboxDeliveryRecipientEntity::getDeliveryId));
    Map<UUID, BoardCardEntity> cardsById = boardCardRepository.findAllById(deliveries.stream()
            .map(BoardCardInboxDeliveryEntity::getCardId)
            .collect(Collectors.toSet()))
        .stream()
        .collect(Collectors.toMap(BoardCardEntity::getId, card -> card));
    Set<UUID> userIds = new LinkedHashSet<>();
    deliveries.forEach(delivery -> userIds.add(delivery.getSentByUserId()));
    recipientsByDeliveryId.values().stream()
        .flatMap(List::stream)
        .map(BoardCardInboxDeliveryRecipientEntity::getUserId)
        .forEach(userIds::add);
    Map<UUID, UserEntity> usersById = userRepository.findAllById(userIds).stream()
        .collect(Collectors.toMap(UserEntity::getId, user -> user));

    return deliveries.stream()
        .map(delivery -> {
          BoardCardEntity card = cardsById.get(delivery.getCardId());
          if (card == null) {
            return null;
          }
          return toInboxItemView(
              delivery,
              card,
              usersById.get(delivery.getSentByUserId()),
              recipientsByDeliveryId.getOrDefault(delivery.getId(), List.of()),
              usersById
          );
        })
        .filter(Objects::nonNull)
        .toList();
  }

  private InboxItemView toInboxItemView(
      BoardCardInboxDeliveryEntity delivery,
      BoardCardEntity card,
      UserEntity sender,
      List<BoardCardInboxDeliveryRecipientEntity> recipients,
      Map<UUID, UserEntity> usersById
  ) {
    List<UserSummary> recipientUsers = recipients.stream()
        .map(recipient -> usersById.get(recipient.getUserId()))
        .filter(Objects::nonNull)
        .map(this::toUserSummary)
        .toList();

    return new InboxItemView(
        delivery.getId(),
        delivery.getCardId(),
        card.getTitle(),
        deriveCardKind(card),
        toUserSummary(sender),
        delivery.getSentFrom(),
        recipients.stream().map(BoardCardInboxDeliveryRecipientEntity::getEmail).toList(),
        recipientUsers,
        delivery.getMessageId(),
        delivery.getThreadId(),
        brazilDateTimeMapper.toDateTime(delivery.getCreatedAt())
    );
  }

  private BoardCardView toCardView(BoardCardEntity card, UUID currentUserId, PlanMemberRole currentRole) {
    UserEntity author = userRepository.findById(card.getAuthorUserId()).orElse(null);
    PlanLabelEntity label = card.getLabelId() == null ? null : planLabelRepository.findById(card.getLabelId()).orElse(null);
    List<UserSummary> assignees = boardCardAssigneeRepository.findByCardId(card.getId()).stream()
        .map(assignee -> userRepository.findById(assignee.getUserId()).orElse(null))
        .filter(Objects::nonNull)
        .map(this::toUserSummary)
        .toList();
    List<CommentView> comments = boardCardCommentRepository.findByCardIdOrderByCreatedAtAsc(card.getId()).stream()
        .map(this::toCommentView)
        .toList();
    List<ChecklistView> checklists = boardChecklistRepository.findByCardIdOrderByPositionIndexAsc(card.getId()).stream()
        .map(this::toChecklistView)
        .toList();
    List<AttachmentView> attachments = cardAttachmentRepository.findByCardId(card.getId()).stream()
        .map(attachment -> toAttachmentView(attachment, currentUserId, currentRole))
        .filter(Objects::nonNull)
        .toList();
    List<GitHubLinkMapper.GitHubLinkedItemView> githubLinks = boardCardGitHubLinkRepository
        .findByCardIdOrderByCreatedAtAsc(card.getId()).stream()
        .map(gitHubLinkMapper::toLinkedItemView)
        .toList();

    return new BoardCardView(
        card.getId(),
        card.getColumnId(),
        card.getTitle(),
        card.getDescription(),
        Boolean.TRUE.equals(card.getCompleted()),
        Boolean.TRUE.equals(card.getStarred()),
        deriveCardKind(card),
        card.getPositionIndex(),
        toUserSummary(author),
        label == null ? null : new LabelView(label.getId(), label.getName(), label.getColor()),
        assignees,
        comments,
        checklists,
        attachments,
        githubLinks,
        brazilDateTimeMapper.toDateTime(card.getStartAt()),
        brazilDateTimeMapper.toDateTime(card.getDueAt()),
        brazilDateTimeMapper.toDateTime(card.getCreatedAt()),
        brazilDateTimeMapper.toDateTime(card.getUpdatedAt())
    );
  }

  private AttachmentView toAttachmentView(CardAttachmentEntity attachment, UUID currentUserId, PlanMemberRole currentRole) {
    FileEntryEntity file = fileEntryRepository.findById(attachment.getFileEntryId()).orElse(null);
    if (file == null || file.getDeletedAt() != null || file.getType() != FileEntryType.FILE) {
      return null;
    }

    UserEntity attachedBy = userRepository.findById(attachment.getAttachedByUserId()).orElse(null);
    boolean attachedByCurrentUser = Objects.equals(attachment.getAttachedByUserId(), currentUserId);
    boolean canRemove = attachedByCurrentUser || currentRole == PlanMemberRole.OWNER || currentRole == PlanMemberRole.ADMIN;

    return new AttachmentView(
        attachment.getId(),
        file.getId(),
        file.getName(),
        file.getType(),
        file.getMimeType(),
        file.getSizeBytes(),
        toUserSummary(attachedBy),
        attachedByCurrentUser,
        canRemove,
        brazilDateTimeMapper.toDateTime(attachment.getCreatedAt())
    );
  }

  private CommentView toCommentView(BoardCardCommentEntity comment) {
    UserEntity author = userRepository.findById(comment.getAuthorUserId()).orElse(null);
    return new CommentView(
        comment.getId(),
        author == null ? "Usuario" : author.getFullName(),
        comment.getMessage(),
        comment.getKind().name(),
        brazilDateTimeMapper.toDateTime(comment.getCreatedAt()),
        toUserSummary(author)
    );
  }

  private BoardCardCommentEntity createComment(UUID cardId, UUID authorUserId, String message, BoardCommentKind kind) {
    BoardCardCommentEntity comment = new BoardCardCommentEntity();
    comment.setCardId(cardId);
    comment.setAuthorUserId(authorUserId);
    comment.setMessage(message);
    comment.setKind(kind == null ? BoardCommentKind.USER_COMMENT : kind);
    return boardCardCommentRepository.save(comment);
  }

  private void appendAssigneeActivity(UUID cardId, UUID userId, List<UUID> previousAssigneeIds, List<UUID> nextAssigneeIds) {
    List<UUID> previous = normalizeAssigneeIds(previousAssigneeIds);
    List<UUID> next = normalizeAssigneeIds(nextAssigneeIds);

    if (previous.equals(next)) {
      return;
    }

    String message = buildAssigneeActivityMessage(previous, next);
    if (!StringUtils.hasText(message)) {
      return;
    }

    createComment(cardId, userId, message, BoardCommentKind.ASSIGNEE_ACTIVITY);
  }

  private String buildAssigneeActivityMessage(List<UUID> previousAssigneeIds, List<UUID> nextAssigneeIds) {
    if (nextAssigneeIds == null || nextAssigneeIds.isEmpty()) {
      return previousAssigneeIds.size() == 1
          ? "removeu o responsavel"
          : "removeu os responsaveis";
    }

    String assigneeNames = nextAssigneeIds.stream()
        .map((assigneeId) -> userRepository.findById(assigneeId).orElse(null))
        .filter(Objects::nonNull)
        .map(UserEntity::getFullName)
        .distinct()
        .reduce((left, right) -> left + ", " + right)
        .orElse("");

    return "atribuiu a: " + (StringUtils.hasText(assigneeNames) ? assigneeNames : "Sem responsaveis");
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
        toUserSummary(assignee),
        brazilDateTimeMapper.toDateTime(item.getStartAt()),
        brazilDateTimeMapper.toDateTime(item.getDueAt())
    );
  }

  private UserSummary toUserSummary(UserEntity user) {
    if (user == null) {
      return null;
    }

    return new UserSummary(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        avatarImageService.avatarUrlFor(AvatarOwnerType.USER, user.getId())
    );
  }

  private BoardColumnEntity requireColumn(UUID planId, UUID columnId) {
    return boardColumnRepository.findById(columnId)
        .filter(column -> column.getPlanId().equals(planId))
        .orElseThrow(() -> new NotFoundException("COLUNA_NAO_ENCONTRADA", "Nao encontramos a coluna informada."));
  }

  private BoardColumnGroupEntity requireColumnGroup(UUID planId, UUID groupId) {
    return boardColumnGroupRepository.findById(groupId)
        .filter(group -> group.getPlanId().equals(planId))
        .orElseThrow(() -> new NotFoundException("AGRUPAMENTO_NAO_ENCONTRADO", "Nao encontramos o agrupamento informado."));
  }

  private boolean isCardInsideExistingGroup(
      List<BoardCardEntity> cards,
      List<BoardColumnGroupEntity> groups,
      UUID cardId
  ) {
    if (cardId == null || cards.isEmpty() || groups.isEmpty()) {
      return false;
    }

    Map<UUID, Integer> indexById = cardIndexById(cards);
    Integer cardIndex = indexById.get(cardId);
    if (cardIndex == null) {
      return false;
    }

    for (BoardColumnGroupEntity group : groups) {
      int[] range = groupRange(indexById, group);
      if (range == null) {
        continue;
      }
      if (cardIndex >= range[0] && cardIndex <= range[1]) {
        return true;
      }
    }
    return false;
  }

  private UUID resolveGroupEndCardId(
      List<BoardCardEntity> cards,
      List<BoardColumnGroupEntity> groups,
      UUID startCardId
  ) {
    Map<UUID, Integer> indexById = cardIndexById(cards);
    Integer start = indexById.get(startCardId);
    if (start == null) {
      return startCardId;
    }

    int end = cards.size() - 1;
    for (BoardColumnGroupEntity group : groups) {
      int[] range = groupRange(indexById, group);
      if (range == null || range[0] <= start) {
        continue;
      }
      end = Math.min(end, range[0] - 1);
    }
    if (end < start) {
      end = start;
    }
    return cards.get(end).getId();
  }

  private Map<UUID, Integer> cardIndexById(List<BoardCardEntity> cards) {
    Map<UUID, Integer> indexById = new HashMap<>();
    for (int i = 0; i < cards.size(); i++) {
      indexById.put(cards.get(i).getId(), i);
    }
    return indexById;
  }

  private int[] groupRange(Map<UUID, Integer> indexById, BoardColumnGroupEntity group) {
    if (group.getStartCardId() == null) {
      return null;
    }
    Integer start = indexById.get(group.getStartCardId());
    if (start == null) {
      return null;
    }
    Integer end = group.getEndCardId() == null ? start : indexById.get(group.getEndCardId());
    if (end == null || end < start) {
      end = start;
    }
    return new int[] { start, end };
  }

  private List<ColumnGroupView> toGroupViews(List<BoardColumnGroupEntity> groups, List<BoardCardEntity> cards) {
    Map<UUID, Integer> indexById = cardIndexById(cards);

    return groups.stream()
        .filter(group -> group.getStartCardId() != null && indexById.containsKey(group.getStartCardId()))
        .sorted(Comparator.comparingInt(group -> indexById.get(group.getStartCardId())))
        .map(group -> {
          int[] range = groupRange(indexById, group);
          UUID endCardId = range == null ? group.getStartCardId() : cards.get(range[1]).getId();
          return new ColumnGroupView(
              group.getId(),
              group.getTitle(),
              group.getStartCardId(),
              endCardId,
              Boolean.TRUE.equals(group.getCollapsed())
          );
        })
        .toList();
  }

  private ColumnGroupView toColumnGroupView(BoardColumnGroupEntity group) {
    List<BoardCardEntity> cards = boardCardRepository.findByColumnIdOrderByPositionIndexAsc(group.getColumnId());
    List<ColumnGroupView> views = toGroupViews(List.of(group), cards);
    if (!views.isEmpty()) {
      return views.get(0);
    }

    return new ColumnGroupView(
        group.getId(),
        group.getTitle(),
        group.getStartCardId(),
        group.getEndCardId() == null ? group.getStartCardId() : group.getEndCardId(),
        Boolean.TRUE.equals(group.getCollapsed())
    );
  }

  private String normalizeGroupTitle(String title) {
    if (title == null) {
      return "";
    }
    String trimmed = title.trim();
    return trimmed.length() > 120 ? trimmed.substring(0, 120) : trimmed;
  }

  private void reassignGroupsAfterRemovingCard(
      UUID columnId,
      UUID removedCardId,
      List<BoardCardEntity> originalOrderedCards,
      List<BoardCardEntity> remainingCards
  ) {
    List<BoardColumnGroupEntity> groups = boardColumnGroupRepository.findByColumnId(columnId);
    if (groups.isEmpty()) {
      return;
    }

    Map<UUID, Integer> originalIndex = cardIndexById(originalOrderedCards);
    Set<UUID> remainingIds = remainingCards.stream()
        .map(BoardCardEntity::getId)
        .collect(Collectors.toCollection(LinkedHashSet::new));

    List<BoardColumnGroupEntity> toDelete = new ArrayList<>();
    List<BoardColumnGroupEntity> toSave = new ArrayList<>();

    for (BoardColumnGroupEntity group : groups) {
      int[] range = groupRange(originalIndex, group);
      if (range == null) {
        toDelete.add(group);
        continue;
      }

      List<UUID> stillInRange = new ArrayList<>();
      for (int i = range[0]; i <= range[1]; i++) {
        UUID cardId = originalOrderedCards.get(i).getId();
        if (!removedCardId.equals(cardId) && remainingIds.contains(cardId)) {
          stillInRange.add(cardId);
        }
      }

      if (stillInRange.isEmpty()) {
        toDelete.add(group);
        continue;
      }

      UUID nextStart = stillInRange.get(0);
      UUID nextEnd = stillInRange.get(stillInRange.size() - 1);
      if (!nextStart.equals(group.getStartCardId()) || !nextEnd.equals(group.getEndCardId())) {
        group.setStartCardId(nextStart);
        group.setEndCardId(nextEnd);
        toSave.add(group);
      }
    }

    if (!toDelete.isEmpty()) {
      boardColumnGroupRepository.deleteAll(toDelete);
    }
    if (!toSave.isEmpty()) {
      boardColumnGroupRepository.saveAll(toSave);
    }
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

  private void addAssignees(UUID cardId, List<UUID> assigneeIds) {
    if (assigneeIds == null || assigneeIds.isEmpty()) {
      return;
    }
    Set<UUID> existingAssigneeIds = boardCardAssigneeRepository.findByCardId(cardId).stream()
        .map(BoardCardAssigneeEntity::getUserId)
        .collect(Collectors.toSet());
    List<BoardCardAssigneeEntity> assignees = assigneeIds.stream()
        .filter(Objects::nonNull)
        .distinct()
        .filter(assigneeId -> !existingAssigneeIds.contains(assigneeId))
        .map(assigneeId -> {
          BoardCardAssigneeEntity entity = new BoardCardAssigneeEntity();
          entity.setCardId(cardId);
          entity.setUserId(assigneeId);
          return entity;
        })
        .toList();
    if (!assignees.isEmpty()) {
      boardCardAssigneeRepository.saveAll(assignees);
    }
  }

  private List<UUID> normalizeAssigneeIds(List<UUID> assigneeIds) {
    if (assigneeIds == null || assigneeIds.isEmpty()) {
      return List.of();
    }

    return assigneeIds.stream()
        .filter(Objects::nonNull)
        .distinct()
        .toList();
  }

  private List<UserEntity> resolveInboxRecipients(UUID planId, UUID cardId, List<UUID> recipientUserIds) {
    LinkedHashSet<UUID> requestedIds = new LinkedHashSet<>();
    if (recipientUserIds == null || recipientUserIds.isEmpty()) {
      boardCardAssigneeRepository.findByCardId(cardId).forEach(assignee -> requestedIds.add(assignee.getUserId()));
    } else {
      recipientUserIds.stream().filter(Objects::nonNull).forEach(requestedIds::add);
    }

    if (requestedIds.isEmpty()) {
      return List.of();
    }

    Set<UUID> memberIds = planMemberRepository.findByPlanId(planId).stream()
        .map(PlanMemberEntity::getUserId)
        .collect(Collectors.toSet());
    if (requestedIds.stream().anyMatch(userId -> !memberIds.contains(userId))) {
      throw new BadRequestException("DESTINATARIO_INVALIDO", "Todos os destinatarios precisam fazer parte do plano.");
    }

    Set<UUID> existingAssigneeIds = boardCardAssigneeRepository.findByCardId(cardId).stream()
        .map(BoardCardAssigneeEntity::getUserId)
        .collect(Collectors.toSet());
    requestedIds.removeIf(existingAssigneeIds::contains);
    if (requestedIds.isEmpty()) {
      return List.of();
    }

    Map<UUID, UserEntity> usersById = userRepository.findAllById(requestedIds).stream()
        .collect(Collectors.toMap(UserEntity::getId, user -> user));
    List<UserEntity> recipients = requestedIds.stream()
        .map(usersById::get)
        .filter(Objects::nonNull)
        .filter(user -> StringUtils.hasText(user.getEmail()))
        .toList();

    if (recipients.size() != requestedIds.size()) {
      throw new BadRequestException("DESTINATARIO_INVALIDO", "Nao foi possivel encontrar todos os destinatarios do e-mail.");
    }
    return recipients;
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

    createLabel(planId, "Design", "#fade48");
    createLabel(planId, "Engenharia", "#2363eb");
    createLabel(planId, "Pesquisa", "#e24123");
    createLabel(planId, "Marketing", "#a90707");
    createLabel(planId, "QA", "#13442f");
  }

  private void createLabel(UUID planId, String name, String color) {
    PlanLabelEntity label = new PlanLabelEntity();
    label.setPlanId(planId);
    label.setName(name);
    label.setColor(color);
    planLabelRepository.save(label);
  }

  public record BoardView(
      UUID planId,
      String planName,
      List<ColumnView> columns,
      List<LabelView> labels,
      List<InboxItemView> inboxItems,
      List<UUID> compactColumnIds
  ) {
  }

  public record CompactColumnsPreferenceView(List<UUID> columnIds) {
  }

  public record ColumnView(
      UUID id,
      String title,
      String color,
      String status,
      int position,
      List<BoardCardView> cards,
      List<ColumnGroupView> groups
  ) {
  }

  public record ColumnGroupView(UUID id, String title, UUID startCardId, UUID endCardId, boolean collapsed) {
  }

  public record BoardCardView(
      UUID id,
      UUID columnId,
      String title,
      String description,
      boolean completed,
      boolean starred,
      CardKind kind,
      int position,
      UserSummary author,
      LabelView label,
      List<UserSummary> assignees,
      List<CommentView> comments,
      List<ChecklistView> checklists,
      List<AttachmentView> attachments,
      List<GitHubLinkMapper.GitHubLinkedItemView> githubLinks,
      ApiDateTimeDto startAt,
      ApiDateTimeDto dueAt,
      ApiDateTimeDto createdAt,
      ApiDateTimeDto updatedAt
  ) {
  }

  public record UserSummary(UUID id, String fullName, String email, String avatarUrl) {
  }

  private String normalizeColumnColor(String color) {
    return color == null ? "" : color.trim();
  }

  private String normalizeColumnStatus(String status) {
    String normalized = status == null ? "" : status.trim();
    if (!normalized.isEmpty() && !VALID_COLUMN_STATUSES.contains(normalized)) {
      throw new BadRequestException("STATUS_INVALIDO", "O status da coluna e invalido.");
    }
    return normalized;
  }

  private static final java.util.Set<String> VALID_COLUMN_STATUSES = java.util.Set.of(
      "pending",
      "planned",
      "in_progress",
      "review",
      "completed",
      "canceled"
  );

  public record LabelView(UUID id, String name, String color) {
  }

  public record CommentView(UUID id, String authorName, String message, String kind, ApiDateTimeDto createdAt, UserSummary author) {
  }

  public record ChecklistView(UUID id, String title, int position, List<ChecklistItemView> items) {
  }

  public record ChecklistItemView(UUID id, String title, boolean completed, int position, UserSummary assignee, ApiDateTimeDto startAt, ApiDateTimeDto dueAt) {
  }

  public record AttachmentView(
      UUID id,
      UUID fileId,
      String name,
      FileEntryType type,
      String mimeType,
      Long sizeBytes,
      UserSummary attachedBy,
      boolean attachedByCurrentUser,
      boolean canRemove,
      ApiDateTimeDto createdAt
  ) {
  }

  public record MessageResponse(String message) {
  }

  public record InboxDeliveryResponse(boolean emailSent, String sentFrom, List<String> sentTo, String messageId, String threadId, InboxItemView inboxItem) {
  }

  public record InboxItemView(
      UUID id,
      UUID cardId,
      String cardTitle,
      CardKind cardKind,
      UserSummary sentBy,
      String sentFrom,
      List<String> sentTo,
      List<UserSummary> recipients,
      String messageId,
      String threadId,
      ApiDateTimeDto sentAt
  ) {
  }

  public enum CardKind {
    CARTAO,
    TAREFA,
    EVENTO
  }
}
