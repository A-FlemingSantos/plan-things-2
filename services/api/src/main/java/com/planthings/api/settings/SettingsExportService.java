package com.planthings.api.settings;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserSessionService;
import com.planthings.api.avatar.AvatarImageEntity;
import com.planthings.api.avatar.AvatarOwnerType;
import com.planthings.api.board.BoardCardAssigneeEntity;
import com.planthings.api.board.BoardCardCommentEntity;
import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardInboxDeliveryEntity;
import com.planthings.api.board.BoardCardInboxDeliveryRecipientEntity;
import com.planthings.api.board.BoardChecklistEntity;
import com.planthings.api.board.BoardChecklistItemEntity;
import com.planthings.api.board.BoardColumnEntity;
import com.planthings.api.calendar.CalendarEventEntity;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.files.CardAttachmentEntity;
import com.planthings.api.files.FileBlobEntity;
import com.planthings.api.files.FileEntryEntity;
import com.planthings.api.files.FileEntryType;
import com.planthings.api.files.FilePlanShareEntity;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.plans.PlanInviteEntity;
import com.planthings.api.plans.PlanLabelEntity;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.settings.GmailIntegrationService.IntegrationsSettings;
import com.planthings.api.workspace.WorkspaceEntity;
import com.planthings.api.workspace.WorkspaceRepository;
import jakarta.persistence.EntityManager;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SettingsExportService {

  private static final DateTimeFormatter FILE_NAME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

  private final AuthenticatedUserService authenticatedUserService;
  private final UserSettingsRepository userSettingsRepository;
  private final WorkspaceRepository workspaceRepository;
  private final GmailIntegrationService gmailIntegrationService;
  private final UserSessionService userSessionService;
  private final EntityManager entityManager;
  private final ObjectMapper objectMapper;
  private final Clock clock;

  public SettingsExportService(
      AuthenticatedUserService authenticatedUserService,
      UserSettingsRepository userSettingsRepository,
      WorkspaceRepository workspaceRepository,
      GmailIntegrationService gmailIntegrationService,
      UserSessionService userSessionService,
      EntityManager entityManager,
      ObjectMapper objectMapper,
      Clock clock
  ) {
    this.authenticatedUserService = authenticatedUserService;
    this.userSettingsRepository = userSettingsRepository;
    this.workspaceRepository = workspaceRepository;
    this.gmailIntegrationService = gmailIntegrationService;
    this.userSessionService = userSessionService;
    this.entityManager = entityManager;
    this.objectMapper = objectMapper;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public ExportBundle exportCurrentUserData() {
    UserEntity user = authenticatedUserService.requireUser();
    UUID currentSessionId = authenticatedUserService.requireSessionId();
    WorkspaceEntity workspace = workspaceRepository.findByOwnerUserId(user.getId()).orElse(null);
    UserSettingsEntity settings = userSettingsRepository.findByUserId(user.getId()).orElse(null);
    IntegrationsSettings integrations = gmailIntegrationService.getIntegrationsForUser(user.getId());
    List<UserSessionService.SessionSummary> sessions = userSessionService.listActiveSessions(user.getId(), currentSessionId);

    List<PlanMemberEntity> memberships = query("""
        select member
        from PlanMemberEntity member
        where member.userId = :userId
        order by member.createdAt asc
        """, PlanMemberEntity.class, Map.of("userId", user.getId()));

    UUID workspaceId = workspace == null ? null : workspace.getId();
    List<PlanEntity> ownedPlans = workspaceId == null
        ? List.of()
        : query("""
            select plan
            from PlanEntity plan
            where plan.workspaceId = :workspaceId
            order by plan.createdAt desc
            """, PlanEntity.class, Map.of("workspaceId", workspaceId));

    Set<UUID> ownedPlanIds = ownedPlans.stream().map(PlanEntity::getId).collect(LinkedHashSet::new, Set::add, Set::addAll);
    Set<UUID> membershipPlanIds = memberships.stream().map(PlanMemberEntity::getPlanId).collect(LinkedHashSet::new, Set::add, Set::addAll);
    membershipPlanIds.removeAll(ownedPlanIds);

    List<PlanEntity> sharedPlans = membershipPlanIds.isEmpty()
        ? List.of()
        : query("""
            select plan
            from PlanEntity plan
            where plan.id in :planIds
            order by plan.createdAt desc
            """, PlanEntity.class, Map.of("planIds", membershipPlanIds));

    List<UUID> allPlanIds = new ArrayList<>();
    ownedPlans.stream().map(PlanEntity::getId).forEach(allPlanIds::add);
    sharedPlans.stream().map(PlanEntity::getId).forEach(allPlanIds::add);

    List<PlanLabelEntity> labels = allPlanIds.isEmpty() ? List.of() : query("""
        select label
        from PlanLabelEntity label
        where label.planId in :planIds
        order by label.name asc
        """, PlanLabelEntity.class, Map.of("planIds", allPlanIds));
    List<PlanInviteEntity> invites = allPlanIds.isEmpty() ? List.of() : query("""
        select invite
        from PlanInviteEntity invite
        where invite.planId in :planIds
        order by invite.createdAt desc
        """, PlanInviteEntity.class, Map.of("planIds", allPlanIds));
    List<PlanMemberEntity> planMembers = allPlanIds.isEmpty() ? List.of() : query("""
        select member
        from PlanMemberEntity member
        where member.planId in :planIds
        order by member.createdAt asc
        """, PlanMemberEntity.class, Map.of("planIds", allPlanIds));
    List<BoardColumnEntity> columns = allPlanIds.isEmpty() ? List.of() : query("""
        select boardColumn
        from BoardColumnEntity boardColumn
        where boardColumn.planId in :planIds
        order by boardColumn.positionIndex asc
        """, BoardColumnEntity.class, Map.of("planIds", allPlanIds));
    List<BoardCardEntity> cards = allPlanIds.isEmpty() ? List.of() : query("""
        select card
        from BoardCardEntity card
        where card.planId in :planIds
        order by card.positionIndex asc
        """, BoardCardEntity.class, Map.of("planIds", allPlanIds));

    List<UUID> cardIds = cards.stream().map(BoardCardEntity::getId).toList();
    List<BoardCardCommentEntity> comments = cardIds.isEmpty() ? List.of() : query("""
        select comment
        from BoardCardCommentEntity comment
        where comment.cardId in :cardIds
        order by comment.createdAt asc
        """, BoardCardCommentEntity.class, Map.of("cardIds", cardIds));
    List<BoardCardAssigneeEntity> assignees = cardIds.isEmpty() ? List.of() : query("""
        select assignee
        from BoardCardAssigneeEntity assignee
        where assignee.cardId in :cardIds
        order by assignee.createdAt asc
        """, BoardCardAssigneeEntity.class, Map.of("cardIds", cardIds));
    List<BoardChecklistEntity> checklists = cardIds.isEmpty() ? List.of() : query("""
        select checklist
        from BoardChecklistEntity checklist
        where checklist.cardId in :cardIds
        order by checklist.positionIndex asc
        """, BoardChecklistEntity.class, Map.of("cardIds", cardIds));

    List<UUID> checklistIds = checklists.stream().map(BoardChecklistEntity::getId).toList();
    List<BoardChecklistItemEntity> checklistItems = checklistIds.isEmpty() ? List.of() : query("""
        select item
        from BoardChecklistItemEntity item
        where item.checklistId in :checklistIds
        order by item.positionIndex asc
        """, BoardChecklistItemEntity.class, Map.of("checklistIds", checklistIds));
    List<BoardCardInboxDeliveryEntity> inboxDeliveries = allPlanIds.isEmpty() ? List.of() : query("""
        select delivery
        from BoardCardInboxDeliveryEntity delivery
        where delivery.planId in :planIds
        order by delivery.createdAt desc
        """, BoardCardInboxDeliveryEntity.class, Map.of("planIds", allPlanIds));

    List<UUID> deliveryIds = inboxDeliveries.stream().map(BoardCardInboxDeliveryEntity::getId).toList();
    List<BoardCardInboxDeliveryRecipientEntity> deliveryRecipients = deliveryIds.isEmpty() ? List.of() : query("""
        select recipient
        from BoardCardInboxDeliveryRecipientEntity recipient
        where recipient.deliveryId in :deliveryIds
        order by recipient.createdAt asc
        """, BoardCardInboxDeliveryRecipientEntity.class, Map.of("deliveryIds", deliveryIds));
    List<CalendarEventEntity> calendarEvents = workspaceId == null ? List.of() : query("""
        select event
        from CalendarEventEntity event
        where event.workspaceId = :workspaceId
        order by event.startsAt asc
        """, CalendarEventEntity.class, Map.of("workspaceId", workspaceId));
    List<FileEntryEntity> files = query("""
        select entry
        from FileEntryEntity entry
        where entry.ownerUserId = :userId
        order by entry.createdAt asc
        """, FileEntryEntity.class, Map.of("userId", user.getId()));

    List<UUID> fileEntryIds = files.stream().map(FileEntryEntity::getId).toList();
    List<FileBlobEntity> fileBlobs = fileEntryIds.isEmpty() ? List.of() : query("""
        select blob
        from FileBlobEntity blob
        where blob.fileEntryId in :fileEntryIds
        """, FileBlobEntity.class, Map.of("fileEntryIds", fileEntryIds));
    List<FilePlanShareEntity> fileShares = fileEntryIds.isEmpty() ? List.of() : query("""
        select share
        from FilePlanShareEntity share
        where share.fileEntryId in :fileEntryIds
        order by share.createdAt asc
        """, FilePlanShareEntity.class, Map.of("fileEntryIds", fileEntryIds));
    List<CardAttachmentEntity> attachments = fileEntryIds.isEmpty() ? List.of() : query("""
        select attachment
        from CardAttachmentEntity attachment
        where attachment.fileEntryId in :fileEntryIds
        order by attachment.createdAt asc
        """, CardAttachmentEntity.class, Map.of("fileEntryIds", fileEntryIds));
    List<AvatarImageEntity> avatars = query("""
        select avatar
        from AvatarImageEntity avatar
        where avatar.ownerId in :ownerIds
          and avatar.ownerType = :ownerType
        order by avatar.createdAt asc
        """, AvatarImageEntity.class, params("ownerIds", List.of(user.getId()), "ownerType", AvatarOwnerType.USER));

    List<Map<String, Object>> externalIdentities = query("""
        select identity
        from UserExternalIdentityEntity identity
        where identity.userId = :userId
        order by identity.createdAt asc
        """, com.planthings.api.auth.UserExternalIdentityEntity.class, Map.of("userId", user.getId())).stream()
        .<Map<String, Object>>map(identity -> {
          LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
          payload.put("id", identity.getId());
          payload.put("provider", identity.getProvider());
          payload.put("email", identity.getEmail());
          payload.put("emailVerified", identity.isEmailVerified());
          payload.put("displayName", identity.getDisplayName());
          payload.put("avatarUrl", identity.getAvatarUrl());
          payload.put("createdAt", toIso(identity.getCreatedAt()));
          payload.put("updatedAt", toIso(identity.getUpdatedAt()));
          return payload;
        })
        .toList();

    LinkedHashMap<String, Object> exportPayload = new LinkedHashMap<>();
    exportPayload.put("exportedAt", toIso(OffsetDateTime.now(clock)));
    exportPayload.put("account", userMap(user));
    exportPayload.put("preferences", preferencesMap(settings));
    exportPayload.put("notifications", notificationsMap(settings));
    exportPayload.put("workspace", workspaceMap(workspace));
    exportPayload.put("memberships", memberships.stream().map(this::planMemberMap).toList());
    exportPayload.put("sharedPlans", sharedPlans.stream().map(this::planMap).toList());
    exportPayload.put("plans", ownedPlans.stream().map(plan -> planBundle(
        plan,
        labels,
        planMembers,
        invites,
        columns,
        cards,
        comments,
        assignees,
        checklists,
        checklistItems,
        inboxDeliveries,
        deliveryRecipients,
        calendarEvents
    )).toList());
    exportPayload.put("sharedHistory", buildSharedHistory(user.getId(), workspaceId));
    exportPayload.put("files", buildFilesSection(files, fileShares, attachments));
    exportPayload.put("integrations", integrations);
    exportPayload.put("sessions", sessions);
    exportPayload.put("externalIdentities", externalIdentities);

    String timestamp = FILE_NAME_FORMATTER.format(OffsetDateTime.now(clock).atZoneSameInstant(ZoneOffset.UTC));
    String filename = "plan-things-export-" + timestamp + ".zip";
    return new ExportBundle(filename, buildZip(exportPayload, avatars, files, fileBlobs));
  }

  private Map<String, Object> buildSharedHistory(UUID userId, UUID workspaceId) {
    LinkedHashMap<String, Object> history = new LinkedHashMap<>();

    List<BoardCardEntity> authoredCards = query("""
        select card
        from BoardCardEntity card
        where card.authorUserId = :userId
          and (:workspaceId is null or card.planId in (
              select plan.id from PlanEntity plan where plan.workspaceId <> :workspaceId
          ))
        order by card.createdAt asc
        """, BoardCardEntity.class, params("userId", userId, "workspaceId", workspaceId));
    List<BoardCardCommentEntity> authoredComments = query("""
        select comment
        from BoardCardCommentEntity comment
        where comment.authorUserId = :userId
        order by comment.createdAt asc
        """, BoardCardCommentEntity.class, Map.of("userId", userId));
    List<CalendarEventEntity> sharedEvents = query("""
        select event
        from CalendarEventEntity event
        where event.creatorUserId = :userId
          and (:workspaceId is null or event.workspaceId <> :workspaceId)
        order by event.startsAt asc
        """, CalendarEventEntity.class, params("userId", userId, "workspaceId", workspaceId));

    history.put("authoredCards", authoredCards.stream().map(this::boardCardMap).toList());
    history.put("authoredComments", authoredComments.stream().map(this::boardCommentMap).toList());
    history.put("sharedCalendarEvents", sharedEvents.stream().map(this::calendarEventMap).toList());
    return history;
  }

  private byte[] buildZip(
      Map<String, Object> exportPayload,
      List<AvatarImageEntity> avatars,
      List<FileEntryEntity> files,
      List<FileBlobEntity> fileBlobs
  ) {
    Map<UUID, FileBlobEntity> blobsByEntryId = new LinkedHashMap<>();
    fileBlobs.forEach(blob -> blobsByEntryId.put(blob.getFileEntryId(), blob));

    try {
      ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
      ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream);

      writeZipEntry(
          zipOutputStream,
          "export.json",
          objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(exportPayload)
      );

      for (AvatarImageEntity avatar : avatars) {
        writeZipEntry(zipOutputStream, "avatars/user-avatar" + extensionForMimeType(avatar.getMimeType()), avatar.getContent());
      }

      for (FileEntryEntity file : files) {
        if (file.getType() != FileEntryType.FILE || file.getDeletedAt() != null) {
          continue;
        }

        FileBlobEntity blob = blobsByEntryId.get(file.getId());
        if (blob == null) {
          continue;
        }

        String safeName = sanitizeFilename(file.getName());
        writeZipEntry(zipOutputStream, "files/" + file.getId() + "-" + safeName, blob.getContent());
      }

      zipOutputStream.finish();
      zipOutputStream.close();
      return outputStream.toByteArray();
    } catch (IOException exception) {
      throw new UncheckedIOException("Nao foi possivel gerar o arquivo de exportacao.", exception);
    }
  }

  private void writeZipEntry(ZipOutputStream zipOutputStream, String path, byte[] content) throws IOException {
    ZipEntry entry = new ZipEntry(path);
    zipOutputStream.putNextEntry(entry);
    zipOutputStream.write(content);
    zipOutputStream.closeEntry();
  }

  private Map<String, Object> buildFilesSection(
      List<FileEntryEntity> files,
      List<FilePlanShareEntity> shares,
      List<CardAttachmentEntity> attachments
  ) {
    LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
    payload.put("entries", files.stream().map(this::fileEntryMap).toList());
    payload.put("shares", shares.stream().map(this::fileShareMap).toList());
    payload.put("attachments", attachments.stream().map(this::attachmentMap).toList());
    return payload;
  }

  private Map<String, Object> planBundle(
      PlanEntity plan,
      List<PlanLabelEntity> labels,
      List<PlanMemberEntity> members,
      List<PlanInviteEntity> invites,
      List<BoardColumnEntity> columns,
      List<BoardCardEntity> cards,
      List<BoardCardCommentEntity> comments,
      List<BoardCardAssigneeEntity> assignees,
      List<BoardChecklistEntity> checklists,
      List<BoardChecklistItemEntity> checklistItems,
      List<BoardCardInboxDeliveryEntity> inboxDeliveries,
      List<BoardCardInboxDeliveryRecipientEntity> deliveryRecipients,
      List<CalendarEventEntity> calendarEvents
  ) {
    UUID planId = plan.getId();
    Set<UUID> planCardIds = cards.stream()
        .filter(card -> planId.equals(card.getPlanId()))
        .map(BoardCardEntity::getId)
        .collect(LinkedHashSet::new, Set::add, Set::addAll);
    Set<UUID> planChecklistIds = checklists.stream()
        .filter(checklist -> planCardIds.contains(checklist.getCardId()))
        .map(BoardChecklistEntity::getId)
        .collect(LinkedHashSet::new, Set::add, Set::addAll);
    Set<UUID> planDeliveryIds = inboxDeliveries.stream()
        .filter(delivery -> planId.equals(delivery.getPlanId()))
        .map(BoardCardInboxDeliveryEntity::getId)
        .collect(LinkedHashSet::new, Set::add, Set::addAll);

    LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
    payload.put("plan", planMap(plan));
    payload.put("members", members.stream().filter(member -> planId.equals(member.getPlanId())).map(this::planMemberMap).toList());
    payload.put("invites", invites.stream().filter(invite -> planId.equals(invite.getPlanId())).map(this::planInviteMap).toList());
    payload.put("labels", labels.stream().filter(label -> planId.equals(label.getPlanId())).map(this::planLabelMap).toList());
    payload.put("columns", columns.stream().filter(column -> planId.equals(column.getPlanId())).map(this::boardColumnMap).toList());
    payload.put("cards", cards.stream().filter(card -> planId.equals(card.getPlanId())).map(this::boardCardMap).toList());
    payload.put("comments", comments.stream().filter(comment -> planCardIds.contains(comment.getCardId())).map(this::boardCommentMap).toList());
    payload.put("assignees", assignees.stream().filter(assignee -> planCardIds.contains(assignee.getCardId())).map(this::boardAssigneeMap).toList());
    payload.put("checklists", checklists.stream().filter(checklist -> planCardIds.contains(checklist.getCardId())).map(this::boardChecklistMap).toList());
    payload.put("checklistItems", checklistItems.stream().filter(item -> planChecklistIds.contains(item.getChecklistId())).map(this::boardChecklistItemMap).toList());
    payload.put("calendarEvents", calendarEvents.stream().filter(event -> planId.equals(event.getPlanId())).map(this::calendarEventMap).toList());
    payload.put("inboxDeliveries", inboxDeliveries.stream().filter(delivery -> planId.equals(delivery.getPlanId())).map(this::inboxDeliveryMap).toList());
    payload.put("inboxRecipients", deliveryRecipients.stream().filter(recipient -> planDeliveryIds.contains(recipient.getDeliveryId())).map(this::inboxRecipientMap).toList());
    return payload;
  }

  private Map<String, Object> userMap(UserEntity user) {
    LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", user.getId());
    payload.put("fullName", user.getFullName());
    payload.put("email", user.getEmail());
    payload.put("locale", user.getLocaleTag());
    payload.put("timeZone", user.getTimeZone());
    payload.put("localPasswordEnabled", user.isLocalPasswordEnabled());
    payload.put("createdAt", toIso(user.getCreatedAt()));
    payload.put("updatedAt", toIso(user.getUpdatedAt()));
    return payload;
  }

  private Map<String, Object> preferencesMap(UserSettingsEntity settings) {
    if (settings == null) {
      return Map.of();
    }

    LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
    payload.put("theme", settings.getTheme());
    payload.put("dateFormat", settings.getDateFormat());
    payload.put("timeFormat", settings.getTimeFormat());
    return payload;
  }

  private Map<String, Object> notificationsMap(UserSettingsEntity settings) {
    if (settings == null) {
      return Map.of();
    }

    LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
    payload.put("emailNotifs", settings.isEmailNotifs());
    payload.put("eventReminders", settings.isEventReminders());
    payload.put("deadlineAlerts", settings.isDeadlineAlerts());
    return payload;
  }

  private Map<String, Object> workspaceMap(WorkspaceEntity workspace) {
    if (workspace == null) {
      return Map.of();
    }

    LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", workspace.getId());
    payload.put("name", workspace.getName());
    payload.put("subscriptionPlan", workspace.getSubscriptionPlan());
    payload.put("createdAt", toIso(workspace.getCreatedAt()));
    payload.put("updatedAt", toIso(workspace.getUpdatedAt()));
    return payload;
  }

  private Map<String, Object> planMap(PlanEntity plan) {
    LinkedHashMap<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", plan.getId());
    payload.put("workspaceId", plan.getWorkspaceId());
    payload.put("ownerUserId", plan.getOwnerUserId());
    payload.put("name", plan.getName());
    payload.put("description", plan.getDescription());
    payload.put("coverThemeId", plan.getCoverThemeId());
    payload.put("coverColor", plan.getCoverColor());
    payload.put("coverImageId", plan.getCoverImageId());
    payload.put("createdAt", toIso(plan.getCreatedAt()));
    payload.put("updatedAt", toIso(plan.getUpdatedAt()));
    return payload;
  }

  private Map<String, Object> planMemberMap(PlanMemberEntity member) {
    return mapOf(
        "id", member.getId(),
        "planId", member.getPlanId(),
        "userId", member.getUserId(),
        "role", member.getRole(),
        "createdAt", toIso(member.getCreatedAt()),
        "updatedAt", toIso(member.getUpdatedAt())
    );
  }

  private Map<String, Object> planInviteMap(PlanInviteEntity invite) {
    return mapOf(
        "id", invite.getId(),
        "planId", invite.getPlanId(),
        "inviterUserId", invite.getInviterUserId(),
        "invitedEmail", invite.getInvitedEmail(),
        "status", invite.getStatus(),
        "expiresAt", toIso(invite.getExpiresAt()),
        "respondedAt", toIso(invite.getRespondedAt()),
        "createdAt", toIso(invite.getCreatedAt()),
        "updatedAt", toIso(invite.getUpdatedAt())
    );
  }

  private Map<String, Object> planLabelMap(PlanLabelEntity label) {
    return mapOf(
        "id", label.getId(),
        "planId", label.getPlanId(),
        "name", label.getName(),
        "color", label.getColor(),
        "createdAt", toIso(label.getCreatedAt()),
        "updatedAt", toIso(label.getUpdatedAt())
    );
  }

  private Map<String, Object> boardColumnMap(BoardColumnEntity column) {
    return mapOf(
        "id", column.getId(),
        "planId", column.getPlanId(),
        "title", column.getTitle(),
        "color", column.getColor(),
        "positionIndex", column.getPositionIndex(),
        "createdAt", toIso(column.getCreatedAt()),
        "updatedAt", toIso(column.getUpdatedAt())
    );
  }

  private Map<String, Object> boardCardMap(BoardCardEntity card) {
    return mapOf(
        "id", card.getId(),
        "planId", card.getPlanId(),
        "columnId", card.getColumnId(),
        "authorUserId", card.getAuthorUserId(),
        "title", card.getTitle(),
        "description", card.getDescription(),
        "labelId", card.getLabelId(),
        "positionIndex", card.getPositionIndex(),
        "completed", card.getCompleted(),
        "startAt", toIso(card.getStartAt()),
        "dueAt", toIso(card.getDueAt()),
        "createdAt", toIso(card.getCreatedAt()),
        "updatedAt", toIso(card.getUpdatedAt())
    );
  }

  private Map<String, Object> boardCommentMap(BoardCardCommentEntity comment) {
    return mapOf(
        "id", comment.getId(),
        "cardId", comment.getCardId(),
        "authorUserId", comment.getAuthorUserId(),
        "kind", comment.getKind() == null ? null : comment.getKind().name(),
        "message", comment.getMessage(),
        "createdAt", toIso(comment.getCreatedAt()),
        "updatedAt", toIso(comment.getUpdatedAt())
    );
  }

  private Map<String, Object> boardAssigneeMap(BoardCardAssigneeEntity assignee) {
    return mapOf(
        "id", assignee.getId(),
        "cardId", assignee.getCardId(),
        "userId", assignee.getUserId(),
        "createdAt", toIso(assignee.getCreatedAt()),
        "updatedAt", toIso(assignee.getUpdatedAt())
    );
  }

  private Map<String, Object> boardChecklistMap(BoardChecklistEntity checklist) {
    return mapOf(
        "id", checklist.getId(),
        "cardId", checklist.getCardId(),
        "title", checklist.getTitle(),
        "positionIndex", checklist.getPositionIndex(),
        "createdAt", toIso(checklist.getCreatedAt()),
        "updatedAt", toIso(checklist.getUpdatedAt())
    );
  }

  private Map<String, Object> boardChecklistItemMap(BoardChecklistItemEntity item) {
    return mapOf(
        "id", item.getId(),
        "checklistId", item.getChecklistId(),
        "title", item.getTitle(),
        "completed", item.getCompleted(),
        "assigneeUserId", item.getAssigneeUserId(),
        "startAt", toIso(item.getStartAt()),
        "dueAt", toIso(item.getDueAt()),
        "positionIndex", item.getPositionIndex(),
        "createdAt", toIso(item.getCreatedAt()),
        "updatedAt", toIso(item.getUpdatedAt())
    );
  }

  private Map<String, Object> calendarEventMap(CalendarEventEntity event) {
    return mapOf(
        "id", event.getId(),
        "workspaceId", event.getWorkspaceId(),
        "creatorUserId", event.getCreatorUserId(),
        "planId", event.getPlanId(),
        "linkedCardId", event.getLinkedCardId(),
        "title", event.getTitle(),
        "description", event.getDescription(),
        "location", event.getLocation(),
        "startsAt", toIso(event.getStartsAt()),
        "endsAt", toIso(event.getEndsAt()),
        "generatedFromCard", event.getGeneratedFromCard(),
        "createdAt", toIso(event.getCreatedAt()),
        "updatedAt", toIso(event.getUpdatedAt())
    );
  }

  private Map<String, Object> inboxDeliveryMap(BoardCardInboxDeliveryEntity delivery) {
    return mapOf(
        "id", delivery.getId(),
        "planId", delivery.getPlanId(),
        "cardId", delivery.getCardId(),
        "sentByUserId", delivery.getSentByUserId(),
        "sentFrom", delivery.getSentFrom(),
        "messageId", delivery.getMessageId(),
        "threadId", delivery.getThreadId(),
        "createdAt", toIso(delivery.getCreatedAt()),
        "updatedAt", toIso(delivery.getUpdatedAt())
    );
  }

  private Map<String, Object> inboxRecipientMap(BoardCardInboxDeliveryRecipientEntity recipient) {
    return mapOf(
        "id", recipient.getId(),
        "deliveryId", recipient.getDeliveryId(),
        "userId", recipient.getUserId(),
        "email", recipient.getEmail(),
        "createdAt", toIso(recipient.getCreatedAt()),
        "updatedAt", toIso(recipient.getUpdatedAt())
    );
  }

  private Map<String, Object> fileEntryMap(FileEntryEntity entry) {
    return mapOf(
        "id", entry.getId(),
        "workspaceId", entry.getWorkspaceId(),
        "ownerUserId", entry.getOwnerUserId(),
        "parentId", entry.getParentId(),
        "type", entry.getType(),
        "name", entry.getName(),
        "mimeType", entry.getMimeType(),
        "sizeBytes", entry.getSizeBytes(),
        "deletedAt", toIso(entry.getDeletedAt()),
        "starred", entry.isStarred(),
        "createdAt", toIso(entry.getCreatedAt()),
        "updatedAt", toIso(entry.getUpdatedAt())
    );
  }

  private Map<String, Object> fileShareMap(FilePlanShareEntity share) {
    return mapOf(
        "id", share.getId(),
        "fileEntryId", share.getFileEntryId(),
        "planId", share.getPlanId(),
        "sharedByUserId", share.getSharedByUserId(),
        "createdAt", toIso(share.getCreatedAt()),
        "updatedAt", toIso(share.getUpdatedAt())
    );
  }

  private Map<String, Object> attachmentMap(CardAttachmentEntity attachment) {
    return mapOf(
        "id", attachment.getId(),
        "cardId", attachment.getCardId(),
        "fileEntryId", attachment.getFileEntryId(),
        "attachedByUserId", attachment.getAttachedByUserId(),
        "createdAt", toIso(attachment.getCreatedAt()),
        "updatedAt", toIso(attachment.getUpdatedAt())
    );
  }

  private <T> List<T> query(String jpql, Class<T> type, Map<String, Object> params) {
    var query = entityManager.createQuery(jpql, type);
    params.forEach(query::setParameter);
    return query.getResultList();
  }

  private Map<String, Object> mapOf(Object... values) {
    LinkedHashMap<String, Object> map = new LinkedHashMap<>();
    for (int index = 0; index < values.length; index += 2) {
      map.put(String.valueOf(values[index]), values[index + 1]);
    }
    return map;
  }

  private Map<String, Object> params(Object... values) {
    LinkedHashMap<String, Object> map = new LinkedHashMap<>();
    for (int index = 0; index < values.length; index += 2) {
      map.put(String.valueOf(values[index]), values[index + 1]);
    }
    return map;
  }

  private String sanitizeFilename(String value) {
    if (value == null || value.isBlank()) {
      return "arquivo";
    }
    return value.replaceAll("[\\\\/:*?\"<>|]+", "-");
  }

  private String extensionForMimeType(String mimeType) {
    if (mimeType == null || mimeType.isBlank()) {
      return ".bin";
    }

    String normalized = mimeType.toLowerCase(Locale.ROOT);
    if (normalized.contains("png")) return ".png";
    if (normalized.contains("jpeg") || normalized.contains("jpg")) return ".jpg";
    if (normalized.contains("webp")) return ".webp";
    if (normalized.contains("gif")) return ".gif";
    if (normalized.contains("json")) return ".json";
    if (normalized.contains("pdf")) return ".pdf";
    if (normalized.contains("plain")) return ".txt";
    return ".bin";
  }

  private String toIso(OffsetDateTime value) {
    return value == null ? null : value.toString();
  }

  public record ExportBundle(String filename, byte[] content) {
  }
}
