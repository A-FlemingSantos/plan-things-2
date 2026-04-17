package com.planthings.api.calendar;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ForbiddenException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.plans.PlanMemberRepository;
import com.planthings.api.workspace.WorkspaceEntity;
import com.planthings.api.workspace.WorkspaceRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CalendarService {

  private final CalendarEventRepository calendarEventRepository;
  private final WorkspaceRepository workspaceRepository;
  private final PlanMemberRepository planMemberRepository;
  private final PlanAccessService planAccessService;
  private final UserRepository userRepository;
  private final BoardCardRepository boardCardRepository;
  private final AuthenticatedUserService authenticatedUserService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;

  public CalendarService(
      CalendarEventRepository calendarEventRepository,
      WorkspaceRepository workspaceRepository,
      PlanMemberRepository planMemberRepository,
      PlanAccessService planAccessService,
      UserRepository userRepository,
      BoardCardRepository boardCardRepository,
      AuthenticatedUserService authenticatedUserService,
      BrazilDateTimeMapper brazilDateTimeMapper
  ) {
    this.calendarEventRepository = calendarEventRepository;
    this.workspaceRepository = workspaceRepository;
    this.planMemberRepository = planMemberRepository;
    this.planAccessService = planAccessService;
    this.userRepository = userRepository;
    this.boardCardRepository = boardCardRepository;
    this.authenticatedUserService = authenticatedUserService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
  }

  public List<EventSummary> listEvents(OffsetDateTime from, OffsetDateTime to) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = workspaceRepository.findByOwnerUserId(currentUser.getId())
        .orElseThrow(() -> new NotFoundException("WORKSPACE_NAO_ENCONTRADA", "Nao encontramos a workspace pessoal deste usuario."));

    List<CalendarEventEntity> standaloneEvents = from != null && to != null
        ? calendarEventRepository.findByWorkspaceIdAndStartsAtBetweenOrderByStartsAtAsc(workspace.getId(), from, to)
        : calendarEventRepository.findByWorkspaceIdOrderByStartsAtAsc(workspace.getId());

    List<PlanMemberEntity> memberships = planMemberRepository.findByUserId(currentUser.getId());
    Set<UUID> planIds = memberships.stream().map(PlanMemberEntity::getPlanId).collect(Collectors.toSet());

    List<CalendarEventEntity> planEvents = planIds.isEmpty()
        ? List.of()
        : (from != null && to != null
            ? calendarEventRepository.findByPlanIdInAndStartsAtBetweenOrderByStartsAtAsc(new ArrayList<>(planIds), from, to)
            : calendarEventRepository.findByPlanIdInOrderByStartsAtAsc(new ArrayList<>(planIds)));

    return java.util.stream.Stream.concat(standaloneEvents.stream(), planEvents.stream())
        .collect(Collectors.toMap(CalendarEventEntity::getId, event -> event, (left, right) -> left))
        .values()
        .stream()
        .sorted(Comparator.comparing(CalendarEventEntity::getStartsAt))
        .map(this::toEventSummary)
        .toList();
  }

  @Transactional
  public EventSummary createStandaloneEvent(String title, String description, String location, OffsetDateTime startsAt, OffsetDateTime endsAt) {
    if (endsAt.isBefore(startsAt) || endsAt.isEqual(startsAt)) {
      throw new BadRequestException("INTERVALO_INVALIDO", "A data final deve ser maior que a data inicial.");
    }

    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = workspaceRepository.findByOwnerUserId(currentUser.getId())
        .orElseThrow(() -> new NotFoundException("WORKSPACE_NAO_ENCONTRADA", "Nao encontramos a workspace pessoal deste usuario."));

    CalendarEventEntity event = new CalendarEventEntity();
    event.setWorkspaceId(workspace.getId());
    event.setCreatorUserId(currentUser.getId());
    event.setTitle(requireTitle(title));
    event.setDescription(normalizeOptional(description));
    event.setLocation(normalizeOptional(location));
    event.setStartsAt(startsAt);
    event.setEndsAt(endsAt);
    event.setGeneratedFromCard(false);
    calendarEventRepository.save(event);

    return toEventSummary(event);
  }

  @Transactional
  public EventSummary updateStandaloneEvent(UUID eventId, String title, String description, String location, OffsetDateTime startsAt, OffsetDateTime endsAt) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    CalendarEventEntity event = calendarEventRepository.findById(eventId)
        .orElseThrow(() -> new NotFoundException("EVENTO_NAO_ENCONTRADO", "Nao encontramos o evento informado."));

    if (Boolean.TRUE.equals(event.getGeneratedFromCard())) {
      throw new ForbiddenException("EVENTO_GERADO_POR_CARTAO", "Eventos gerados automaticamente por cartoes devem ser alterados pelo board.");
    }

    if (!event.getCreatorUserId().equals(currentUser.getId())) {
      throw new ForbiddenException("EDICAO_DE_EVENTO_NEGADA", "Voce nao pode editar este evento.");
    }

    event.setTitle(requireTitle(title));
    event.setDescription(normalizeOptional(description));
    event.setLocation(normalizeOptional(location));
    event.setStartsAt(startsAt);
    event.setEndsAt(endsAt);
    calendarEventRepository.save(event);
    return toEventSummary(event);
  }

  @Transactional
  public MessageResponse deleteStandaloneEvent(UUID eventId) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    CalendarEventEntity event = calendarEventRepository.findById(eventId)
        .orElseThrow(() -> new NotFoundException("EVENTO_NAO_ENCONTRADO", "Nao encontramos o evento informado."));

    if (Boolean.TRUE.equals(event.getGeneratedFromCard())) {
      throw new ForbiddenException("EVENTO_GERADO_POR_CARTAO", "Eventos gerados automaticamente por cartoes devem ser removidos pelo board.");
    }

    if (!event.getCreatorUserId().equals(currentUser.getId())) {
      throw new ForbiddenException("EXCLUSAO_DE_EVENTO_NEGADA", "Voce nao pode excluir este evento.");
    }

    calendarEventRepository.delete(event);
    return new MessageResponse("Evento excluido com sucesso.");
  }

  @Transactional
  public void syncCardEvent(PlanEntity plan, BoardCardEntity card) {
    if (card.getStartAt() == null && card.getDueAt() == null) {
      calendarEventRepository.findByLinkedCardId(card.getId()).ifPresent(calendarEventRepository::delete);
      return;
    }

    OffsetDateTime startsAt = card.getStartAt() != null ? card.getStartAt() : card.getDueAt().minusHours(1);
    OffsetDateTime endsAt = card.getDueAt() != null ? card.getDueAt() : startsAt.plusHours(1);

    CalendarEventEntity event = calendarEventRepository.findByLinkedCardId(card.getId())
        .orElseGet(CalendarEventEntity::new);
    event.setWorkspaceId(plan.getWorkspaceId());
    event.setCreatorUserId(card.getAuthorUserId());
    event.setPlanId(plan.getId());
    event.setLinkedCardId(card.getId());
    event.setTitle(card.getTitle());
    event.setDescription(card.getDescription());
    event.setStartsAt(startsAt);
    event.setEndsAt(endsAt);
    event.setGeneratedFromCard(true);
    calendarEventRepository.save(event);
  }

  @Transactional
  public void removeCardEvent(UUID cardId) {
    calendarEventRepository.findByLinkedCardId(cardId).ifPresent(calendarEventRepository::delete);
  }

  public EventSummary getEventForPlan(UUID planId, UUID eventId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);
    CalendarEventEntity event = calendarEventRepository.findById(eventId)
        .orElseThrow(() -> new NotFoundException("EVENTO_NAO_ENCONTRADO", "Nao encontramos o evento informado."));
    if (event.getPlanId() == null || !event.getPlanId().equals(planId)) {
      throw new NotFoundException("EVENTO_NAO_ENCONTRADO", "Nao encontramos este evento para o plano informado.");
    }
    return toEventSummary(event);
  }

  private EventSummary toEventSummary(CalendarEventEntity event) {
    UserEntity creator = userRepository.findById(event.getCreatorUserId()).orElse(null);
    return new EventSummary(
        event.getId(),
        event.getPlanId(),
        event.getLinkedCardId(),
        event.getTitle(),
        event.getDescription(),
        event.getLocation(),
        event.getGeneratedFromCard(),
        deriveLinkedCardKind(event),
        creator == null ? null : creator.getFullName(),
        brazilDateTimeMapper.toDateTime(event.getStartsAt()),
        brazilDateTimeMapper.toDateTime(event.getEndsAt()),
        brazilDateTimeMapper.toDateTime(event.getCreatedAt())
    );
  }

  private String deriveLinkedCardKind(CalendarEventEntity event) {
    if (!Boolean.TRUE.equals(event.getGeneratedFromCard()) || event.getLinkedCardId() == null) {
      return null;
    }

    return boardCardRepository.findById(event.getLinkedCardId())
        .map(card -> {
          if (card.getStartAt() != null && card.getDueAt() != null) {
            return "EVENTO";
          }
          if (card.getDueAt() != null) {
            return "TAREFA";
          }
          return "CARTAO";
        })
        .orElse(null);
  }

  private String requireTitle(String title) {
    String normalized = title == null ? "" : title.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException("TITULO_OBRIGATORIO", "O titulo do evento e obrigatorio.");
    }
    return normalized;
  }

  private String normalizeOptional(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  public record EventSummary(
      UUID id,
      UUID planId,
      UUID linkedCardId,
      String title,
      String description,
      String location,
      boolean generatedFromCard,
      String cardKind,
      String createdBy,
      ApiDateTimeDto startsAt,
      ApiDateTimeDto endsAt,
      ApiDateTimeDto createdAt
  ) {
  }

  public record MessageResponse(String message) {
  }
}
