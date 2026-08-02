package com.planthings.api.plans;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.avatar.AvatarImageService;
import com.planthings.api.avatar.AvatarOwnerType;
import com.planthings.api.board.BoardCardAssigneeRepository;
import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardInboxDeliveryRepository;
import com.planthings.api.board.BoardChecklistItemRepository;
import com.planthings.api.board.BoardColumnEntity;
import com.planthings.api.board.BoardColumnRepository;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.calendar.CalendarEventRepository;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ConflictException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.intelligence.persistence.AiConversationRepository;
import com.planthings.api.workspace.PersonalWorkspaceService;
import com.planthings.api.workspace.WorkspaceEntity;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlanService {

  private final PlanRepository planRepository;
  private final PlanMemberRepository planMemberRepository;
  private final PlanInviteRepository planInviteRepository;
  private final PlanLabelRepository planLabelRepository;
  private final UserRepository userRepository;
  private final PersonalWorkspaceService personalWorkspaceService;
  private final BoardColumnRepository boardColumnRepository;
  private final BoardCardRepository boardCardRepository;
  private final BoardCardAssigneeRepository boardCardAssigneeRepository;
  private final BoardChecklistItemRepository boardChecklistItemRepository;
  private final BoardCardInboxDeliveryRepository boardCardInboxDeliveryRepository;
  private final CalendarEventRepository calendarEventRepository;
  private final AiConversationRepository aiConversationRepository;
  private final AuthenticatedUserService authenticatedUserService;
  private final PlanAccessService planAccessService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final PlanInviteEmailSender planInviteEmailSender;
  private final AvatarImageService avatarImageService;
  private final Clock clock;
  private final String frontendBaseUrl;

  public PlanService(
      PlanRepository planRepository,
      PlanMemberRepository planMemberRepository,
      PlanInviteRepository planInviteRepository,
      PlanLabelRepository planLabelRepository,
      UserRepository userRepository,
      PersonalWorkspaceService personalWorkspaceService,
      BoardColumnRepository boardColumnRepository,
      BoardCardRepository boardCardRepository,
      BoardCardAssigneeRepository boardCardAssigneeRepository,
      BoardChecklistItemRepository boardChecklistItemRepository,
      BoardCardInboxDeliveryRepository boardCardInboxDeliveryRepository,
      CalendarEventRepository calendarEventRepository,
      AiConversationRepository aiConversationRepository,
      AuthenticatedUserService authenticatedUserService,
      PlanAccessService planAccessService,
      BrazilDateTimeMapper brazilDateTimeMapper,
      PlanInviteEmailSender planInviteEmailSender,
      AvatarImageService avatarImageService,
      Clock clock,
      @Value("${app.frontend-base-url}") String frontendBaseUrl
  ) {
    this.planRepository = planRepository;
    this.planMemberRepository = planMemberRepository;
    this.planInviteRepository = planInviteRepository;
    this.planLabelRepository = planLabelRepository;
    this.userRepository = userRepository;
    this.personalWorkspaceService = personalWorkspaceService;
    this.boardColumnRepository = boardColumnRepository;
    this.boardCardRepository = boardCardRepository;
    this.boardCardAssigneeRepository = boardCardAssigneeRepository;
    this.boardChecklistItemRepository = boardChecklistItemRepository;
    this.boardCardInboxDeliveryRepository = boardCardInboxDeliveryRepository;
    this.calendarEventRepository = calendarEventRepository;
    this.aiConversationRepository = aiConversationRepository;
    this.authenticatedUserService = authenticatedUserService;
    this.planAccessService = planAccessService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.planInviteEmailSender = planInviteEmailSender;
    this.avatarImageService = avatarImageService;
    this.clock = clock;
    this.frontendBaseUrl = normalizeFrontendBaseUrl(frontendBaseUrl);
  }

  public List<PlanSummary> listAccessiblePlans() {
    UUID currentUserId = authenticatedUserService.requireUserId();
    List<PlanMemberEntity> memberships = planMemberRepository.findByUserId(currentUserId);
    Set<UUID> planIds = memberships.stream().map(PlanMemberEntity::getPlanId).collect(Collectors.toSet());

    return planRepository.findAllById(planIds).stream()
        .sorted(Comparator.comparing(PlanEntity::getCreatedAt).reversed())
        .map(plan -> toPlanSummary(plan, currentUserId))
        .toList();
  }

  public PlanDetails getPlan(UUID planId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, currentUserId);
    return toPlanDetails(plan, currentUserId);
  }

  @Transactional
  public PlanDetails createPlan(
      String name,
      String description,
      String coverThemeId,
      String cover,
      String coverImageId
  ) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(currentUser);

    PlanEntity plan = new PlanEntity();
    plan.setWorkspaceId(workspace.getId());
    plan.setOwnerUserId(currentUser.getId());
    plan.setName(requireName(name));
    plan.setDescription(normalizeOptional(description));
    applyCover(plan, coverThemeId, cover, coverImageId);
    planRepository.save(plan);

    PlanMemberEntity ownerMembership = new PlanMemberEntity();
    ownerMembership.setPlanId(plan.getId());
    ownerMembership.setUserId(currentUser.getId());
    ownerMembership.setRole(PlanMemberRole.OWNER);
    planMemberRepository.save(ownerMembership);

    return toPlanDetails(plan, currentUser.getId());
  }

  @Transactional
  public PlanDetails updatePlan(
      UUID planId,
      String name,
      String description,
      String coverThemeId,
      String cover,
      String coverImageId
  ) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    PlanEntity plan = planAccessService.requirePlanMember(planId, currentUserId);
    plan.setName(requireName(name));
    plan.setDescription(normalizeOptional(description));
    applyCover(plan, coverThemeId, cover, coverImageId);
    planRepository.save(plan);
    return toPlanDetails(plan, currentUserId);
  }

  @Transactional
  public MessageResponse deletePlan(UUID planId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanManager(planId, currentUserId);
    List<UUID> cardIds = boardCardRepository.findByPlanIdOrderByPositionIndexAsc(planId).stream()
        .map(BoardCardEntity::getId)
        .toList();
    if (!cardIds.isEmpty()) {
      aiConversationRepository.deleteByCardIdIn(cardIds);
    }
    aiConversationRepository.deleteByPlanId(planId);
    boardCardInboxDeliveryRepository.deleteByPlanId(planId);
    calendarEventRepository.deleteForPlan(planId);
    planRepository.deleteById(planId);
    return new MessageResponse("Plano excluido com sucesso.");
  }

  public List<MemberSummary> listMembers(UUID planId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);

    List<PlanMemberEntity> members = planMemberRepository.findByPlanId(planId);
    Set<UUID> userIds = members.stream().map(PlanMemberEntity::getUserId).collect(Collectors.toSet());
    List<UserEntity> users = userRepository.findAllById(userIds);

    return members.stream()
        .map(member -> toMemberSummary(member, users))
        .sorted(Comparator.comparing(MemberSummary::fullName))
        .toList();
  }

  @Transactional
  public InviteResponse inviteMember(UUID planId, String email) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    planAccessService.requirePlanManager(planId, currentUser.getId());
    PlanEntity plan = planRepository.findById(planId)
        .orElseThrow(() -> new NotFoundException("PLANO_NAO_ENCONTRADO", "Plano nao encontrado."));

    String normalizedEmail = normalizeEmail(email);
    planInviteRepository.findByPlanIdAndInvitedEmailIgnoreCaseAndStatus(planId, normalizedEmail, PlanInviteStatus.PENDING)
        .ifPresent(invite -> {
          throw new ConflictException("CONVITE_PENDENTE", "Ja existe um convite pendente para este e-mail.");
        });

    userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(user -> {
      if (planMemberRepository.existsByPlanIdAndUserId(planId, user.getId())) {
        throw new ConflictException("USUARIO_JA_E_MEMBRO", "Este usuario ja faz parte do plano.");
      }
    });

    PlanInviteEntity invite = new PlanInviteEntity();
    invite.setPlanId(planId);
    invite.setInviterUserId(currentUser.getId());
    invite.setInvitedEmail(normalizedEmail);
    invite.setToken(UUID.randomUUID().toString());
    invite.setStatus(PlanInviteStatus.PENDING);
    invite.setExpiresAt(OffsetDateTime.now(clock).plusDays(7));
    ApiDateTimeDto expiresAt = brazilDateTimeMapper.toDateTime(invite.getExpiresAt());
    PlanInviteEmailSender.Delivery delivery = planInviteEmailSender.sendInvite(
        currentUser,
        normalizedEmail,
        plan.getName(),
        buildInviteUrl(invite.getToken()),
        expiresAt
    );

    planInviteRepository.save(invite);
    return new InviteResponse(
        invite.getId(),
        invite.getInvitedEmail(),
        invite.getStatus(),
        invite.getToken(),
        expiresAt,
        new InviteDeliveryResponse(delivery.emailSent(), delivery.sentTo(), delivery.sentFrom())
    );
  }

  @Transactional
  public AcceptInviteResponse acceptInvite(String token) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    PlanInviteEntity invite = planInviteRepository.findByToken(token)
        .orElseThrow(() -> new NotFoundException("CONVITE_NAO_ENCONTRADO", "Nao encontramos um convite com este token."));

    if (invite.getStatus() != PlanInviteStatus.PENDING) {
      throw new BadRequestException("CONVITE_INVALIDO", "Este convite nao esta mais disponivel para aceite.");
    }

    if (invite.getExpiresAt().isBefore(OffsetDateTime.now(clock))) {
      invite.setStatus(PlanInviteStatus.EXPIRED);
      planInviteRepository.save(invite);
      throw new BadRequestException("CONVITE_EXPIRADO", "Este convite expirou.");
    }

    if (!invite.getInvitedEmail().equalsIgnoreCase(currentUser.getEmail())) {
      throw new BadRequestException("EMAIL_DIFERENTE", "Este convite foi enviado para outro e-mail.");
    }

    if (!planMemberRepository.existsByPlanIdAndUserId(invite.getPlanId(), currentUser.getId())) {
      PlanMemberEntity membership = new PlanMemberEntity();
      membership.setPlanId(invite.getPlanId());
      membership.setUserId(currentUser.getId());
      membership.setRole(PlanMemberRole.MEMBER);
      planMemberRepository.save(membership);
    }

    invite.setStatus(PlanInviteStatus.ACCEPTED);
    invite.setRespondedAt(OffsetDateTime.now(clock));
    planInviteRepository.save(invite);
    return new AcceptInviteResponse(invite.getPlanId(), "Convite aceito com sucesso.");
  }

  @Transactional
  public InvitePreviewResponse getInvitePreview(String token) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    PlanInviteEntity invite = planInviteRepository.findByToken(token)
        .orElseThrow(() -> new NotFoundException("CONVITE_NAO_ENCONTRADO", "Nao encontramos um convite com este token."));

    if (!invite.getInvitedEmail().equalsIgnoreCase(currentUser.getEmail())) {
      throw new BadRequestException("EMAIL_DIFERENTE", "Este convite foi enviado para outro e-mail.");
    }

    if (invite.getStatus() == PlanInviteStatus.PENDING && invite.getExpiresAt().isBefore(OffsetDateTime.now(clock))) {
      invite.setStatus(PlanInviteStatus.EXPIRED);
      planInviteRepository.save(invite);
    }

    return toInvitePreviewResponse(invite);
  }

  @Transactional
  public MessageResponse declineInvite(String token) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    PlanInviteEntity invite = planInviteRepository.findByToken(token)
        .orElseThrow(() -> new NotFoundException("CONVITE_NAO_ENCONTRADO", "Nao encontramos um convite com este token."));

    if (!invite.getInvitedEmail().equalsIgnoreCase(currentUser.getEmail())) {
      throw new BadRequestException("EMAIL_DIFERENTE", "Este convite foi enviado para outro e-mail.");
    }

    if (invite.getStatus() != PlanInviteStatus.PENDING) {
      throw new BadRequestException("CONVITE_INVALIDO", "Este convite nao esta mais disponivel para recusa.");
    }

    if (invite.getExpiresAt().isBefore(OffsetDateTime.now(clock))) {
      invite.setStatus(PlanInviteStatus.EXPIRED);
      planInviteRepository.save(invite);
      throw new BadRequestException("CONVITE_EXPIRADO", "Este convite expirou.");
    }

    invite.setStatus(PlanInviteStatus.DECLINED);
    invite.setRespondedAt(OffsetDateTime.now(clock));
    planInviteRepository.save(invite);
    return new MessageResponse("Convite recusado com sucesso.");
  }

  @Transactional
  public MessageResponse removeMember(UUID planId, UUID memberUserId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanManager(planId, currentUserId);

    PlanMemberEntity member = planMemberRepository.findByPlanIdAndUserId(planId, memberUserId)
        .orElseThrow(() -> new NotFoundException("MEMBRO_NAO_ENCONTRADO", "Nao encontramos este membro no plano."));

    if (member.getRole() == PlanMemberRole.OWNER) {
      throw new BadRequestException("OWNER_NAO_PODE_SER_REMOVIDO", "O owner do plano nao pode ser removido.");
    }

    List<UUID> cardIds = boardCardRepository.findByPlanIdOrderByPositionIndexAsc(planId).stream()
        .map(BoardCardEntity::getId)
        .toList();
    if (!cardIds.isEmpty()) {
      boardCardAssigneeRepository.deleteByUserIdAndCardIdIn(memberUserId, cardIds);
    }
    boardChecklistItemRepository.clearAssigneeForPlanUser(planId, memberUserId);
    planMemberRepository.delete(member);
    return new MessageResponse("Membro removido com sucesso.");
  }

  @Transactional
  public MemberSummary updateMemberRole(UUID planId, UUID memberUserId, PlanMemberRole role) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanManager(planId, currentUserId);

    if (role == null || role == PlanMemberRole.OWNER) {
      throw new BadRequestException("CARGO_INVALIDO", "Nao e possivel atribuir o cargo de proprietario por este fluxo.");
    }

    PlanMemberEntity member = planMemberRepository.findByPlanIdAndUserId(planId, memberUserId)
        .orElseThrow(() -> new NotFoundException("MEMBRO_NAO_ENCONTRADO", "Nao encontramos este membro no plano."));

    if (member.getRole() == PlanMemberRole.OWNER) {
      throw new BadRequestException("OWNER_NAO_PODE_SER_ALTERADO", "O cargo do proprietario nao pode ser alterado.");
    }

    member.setRole(role);
    planMemberRepository.save(member);

    UserEntity user = userRepository.findById(memberUserId)
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos os dados de um membro do plano."));
    return toMemberSummary(member, List.of(user));
  }

  public List<LabelSummary> listLabels(UUID planId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);
    return planLabelRepository.findByPlanIdOrderByNameAsc(planId).stream()
        .map(label -> new LabelSummary(label.getId(), label.getName(), label.getColor()))
        .toList();
  }

  @Transactional
  public LabelSummary createLabel(UUID planId, String name, String color) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, currentUserId);

    PlanLabelEntity label = new PlanLabelEntity();
    label.setPlanId(planId);
    label.setName(requireName(name));
    label.setColor(color == null || color.isBlank() ? "#a0a0a0" : color.trim());
    planLabelRepository.save(label);
    return new LabelSummary(label.getId(), label.getName(), label.getColor());
  }

  private PlanSummary toPlanSummary(PlanEntity plan, UUID currentUserId) {
    PlanMemberRole role = planAccessService.requireMemberRole(plan.getId(), currentUserId);
    long memberCount = planMemberRepository.findByPlanId(plan.getId()).size();
    long taskCount = boardCardRepository.countByPlanId(plan.getId());
    return new PlanSummary(
        plan.getId(),
        plan.getName(),
        plan.getDescription(),
        plan.getCoverThemeId(),
        plan.getCoverColor(),
        plan.getCoverImageId(),
        role,
        memberCount,
        taskCount,
        brazilDateTimeMapper.toDateTime(plan.getCreatedAt()),
        brazilDateTimeMapper.toDateTime(plan.getUpdatedAt())
    );
  }

  private PlanDetails toPlanDetails(PlanEntity plan, UUID currentUserId) {
    return new PlanDetails(
        toPlanSummary(plan, currentUserId),
        listMembers(plan.getId()),
        listLabels(plan.getId())
    );
  }

  private MemberSummary toMemberSummary(PlanMemberEntity member, List<UserEntity> users) {
    UserEntity user = users.stream()
        .filter(candidate -> candidate.getId().equals(member.getUserId()))
        .findFirst()
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos os dados de um membro do plano."));

    return new MemberSummary(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        avatarImageService.avatarUrlFor(AvatarOwnerType.USER, user.getId()),
        member.getRole(),
        brazilDateTimeMapper.toDateTime(member.getCreatedAt())
    );
  }

  private InviteResponse toInviteResponse(PlanInviteEntity invite) {
    return new InviteResponse(
        invite.getId(),
        invite.getInvitedEmail(),
        invite.getStatus(),
        invite.getToken(),
        brazilDateTimeMapper.toDateTime(invite.getExpiresAt()),
        null
    );
  }

  private InvitePreviewResponse toInvitePreviewResponse(PlanInviteEntity invite) {
    PlanEntity plan = planRepository.findById(invite.getPlanId())
        .orElseThrow(() -> new NotFoundException("PLANO_NAO_ENCONTRADO", "Nao encontramos o plano deste convite."));
    return new InvitePreviewResponse(
        invite.getId(),
        invite.getPlanId(),
        plan.getName(),
        invite.getInvitedEmail(),
        invite.getStatus(),
        invite.getToken(),
        brazilDateTimeMapper.toDateTime(invite.getExpiresAt())
    );
  }

  private String requireName(String value) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException("NOME_OBRIGATORIO", "O nome e obrigatorio.");
    }
    return normalized;
  }

  private String normalizeOptional(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private void applyCover(PlanEntity plan, String coverThemeId, String cover, String coverImageId) {
    String normalizedThemeId = normalizeOptional(coverThemeId);
    String normalizedCover = normalizeOptional(cover);
    String normalizedImageId = canonicalizeCoverImageId(normalizeOptional(coverImageId));

    if (normalizedImageId != null) {
      plan.setCoverImageId(normalizedImageId);
      plan.setCoverThemeId(null);
      plan.setCoverColor(null);
      return;
    }

    if (normalizedThemeId != null) {
      plan.setCoverThemeId(normalizedThemeId);
      plan.setCoverColor(normalizedCover);
      plan.setCoverImageId(null);
      return;
    }

    plan.setCoverThemeId(null);
    plan.setCoverColor(null);
    plan.setCoverImageId(null);
  }

  private String canonicalizeCoverImageId(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }

    String normalized = value.trim().replace("\\", "/");
    if (normalized.startsWith("background-collections/")) {
      return normalized;
    }

    String marker = "/background-collections/";
    int index = normalized.indexOf(marker);
    if (index >= 0) {
      return "background-collections/" + normalized.substring(index + marker.length());
    }

    return normalized;
  }

  private String normalizeEmail(String email) {
    String normalized = email == null ? "" : email.trim().toLowerCase();
    if (normalized.isBlank()) {
      throw new BadRequestException("EMAIL_OBRIGATORIO", "O e-mail e obrigatorio.");
    }
    return normalized;
  }

  private String normalizeFrontendBaseUrl(String value) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.isBlank()) {
      throw new IllegalArgumentException("app.frontend-base-url must be configured.");
    }
    while (normalized.endsWith("/")) {
      normalized = normalized.substring(0, normalized.length() - 1);
    }
    return normalized;
  }

  private String buildInviteUrl(String token) {
    return frontendBaseUrl + "/plans/invites/" + token;
  }

  public record PlanSummary(
      UUID id,
      String name,
      String description,
      String coverThemeId,
      String cover,
      String coverImageId,
      PlanMemberRole role,
      long memberCount,
      long taskCount,
      ApiDateTimeDto createdAt,
      ApiDateTimeDto updatedAt
  ) {
  }

  public record PlanDetails(
      PlanSummary plan,
      List<MemberSummary> members,
      List<LabelSummary> labels
  ) {
  }

  public record MemberSummary(
      UUID userId,
      String fullName,
      String email,
      String avatarUrl,
      PlanMemberRole role,
      ApiDateTimeDto joinedAt
  ) {
  }

  public record InviteResponse(
      UUID inviteId,
      String invitedEmail,
      PlanInviteStatus status,
      String token,
      ApiDateTimeDto expiresAt,
      InviteDeliveryResponse delivery
  ) {
  }

  public record InviteDeliveryResponse(
      boolean emailSent,
      String sentTo,
      String sentFrom
  ) {
  }

  public record InvitePreviewResponse(
      UUID inviteId,
      UUID planId,
      String planName,
      String invitedEmail,
      PlanInviteStatus status,
      String token,
      ApiDateTimeDto expiresAt
  ) {
  }

  public record AcceptInviteResponse(UUID planId, String message) {
  }

  public record LabelSummary(UUID id, String name, String color) {
  }

  public record MessageResponse(String message) {
  }
}
