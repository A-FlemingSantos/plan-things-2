package com.planthings.api.workspace;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.avatar.AvatarImageService;
import com.planthings.api.avatar.AvatarOwnerType;
import com.planthings.api.calendar.CalendarEventRepository;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.files.FileEntryRepository;
import com.planthings.api.plans.PlanMemberRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class WorkspaceService {

  private final PersonalWorkspaceService personalWorkspaceService;
  private final PlanMemberRepository planMemberRepository;
  private final WorkspaceRepository workspaceRepository;
  private final FileEntryRepository fileEntryRepository;
  private final CalendarEventRepository calendarEventRepository;
  private final AuthenticatedUserService authenticatedUserService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final AvatarImageService avatarImageService;

  public WorkspaceService(
      PersonalWorkspaceService personalWorkspaceService,
      PlanMemberRepository planMemberRepository,
      WorkspaceRepository workspaceRepository,
      FileEntryRepository fileEntryRepository,
      CalendarEventRepository calendarEventRepository,
      AuthenticatedUserService authenticatedUserService,
      BrazilDateTimeMapper brazilDateTimeMapper,
      AvatarImageService avatarImageService
  ) {
    this.personalWorkspaceService = personalWorkspaceService;
    this.planMemberRepository = planMemberRepository;
    this.workspaceRepository = workspaceRepository;
    this.fileEntryRepository = fileEntryRepository;
    this.calendarEventRepository = calendarEventRepository;
    this.authenticatedUserService = authenticatedUserService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.avatarImageService = avatarImageService;
  }

  public WorkspaceDashboard getCurrentWorkspace() {
    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(currentUser);

    long plansCount = planMemberRepository.findByUserId(currentUser.getId()).size();
    long fileCount = fileEntryRepository.findByWorkspaceIdAndOwnerUserIdAndDeletedAtIsNullOrderByTypeAscNameAsc(workspace.getId(), currentUser.getId()).size();
    long eventCount = calendarEventRepository.findByWorkspaceIdOrderByStartsAtAsc(workspace.getId()).size();

    return new WorkspaceDashboard(
        workspace.getId(),
        workspace.getName(),
        avatarImageService.avatarUrlFor(AvatarOwnerType.WORKSPACE, workspace.getId()),
        new WorkspaceOwner(currentUser.getId(), currentUser.getFullName(), currentUser.getEmail()),
        plansCount,
        fileCount,
        eventCount,
        brazilDateTimeMapper.toDateTime(workspace.getCreatedAt())
    );
  }

  @Transactional
  public WorkspaceSummary updateCurrentWorkspaceName(String name) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(currentUser);

    workspace.setName(requireName(name));
    workspaceRepository.save(workspace);

    return new WorkspaceSummary(
        workspace.getId(),
        workspace.getName(),
        avatarImageService.avatarUrlFor(AvatarOwnerType.WORKSPACE, workspace.getId()),
        brazilDateTimeMapper.toDateTime(workspace.getCreatedAt())
    );
  }

  @Transactional
  public WorkspaceSummary uploadCurrentWorkspaceAvatar(MultipartFile avatar) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(currentUser);
    avatarImageService.upload(AvatarOwnerType.WORKSPACE, workspace.getId(), avatar);
    return toWorkspaceSummary(workspace);
  }

  @Transactional
  public WorkspaceSummary removeCurrentWorkspaceAvatar() {
    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(currentUser);
    avatarImageService.remove(AvatarOwnerType.WORKSPACE, workspace.getId());
    return toWorkspaceSummary(workspace);
  }

  @Transactional(readOnly = true)
  public AvatarImageService.AvatarDownload getCurrentWorkspaceAvatar() {
    UserEntity currentUser = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(currentUser);
    return avatarImageService.download(AvatarOwnerType.WORKSPACE, workspace.getId());
  }

  private String requireName(String value) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException("NOME_WORKSPACE_OBRIGATORIO", "O nome do workspace e obrigatorio.");
    }
    if (normalized.length() > 120) {
      throw new BadRequestException("NOME_WORKSPACE_INVALIDO", "O nome do workspace deve ter no maximo 120 caracteres.");
    }
    return normalized;
  }

  private WorkspaceSummary toWorkspaceSummary(WorkspaceEntity workspace) {
    return new WorkspaceSummary(
        workspace.getId(),
        workspace.getName(),
        avatarImageService.avatarUrlFor(AvatarOwnerType.WORKSPACE, workspace.getId()),
        brazilDateTimeMapper.toDateTime(workspace.getCreatedAt())
    );
  }

  public record WorkspaceDashboard(
      UUID id,
      String name,
      String avatarUrl,
      WorkspaceOwner owner,
      long plansCount,
      long personalFilesCount,
      long standaloneEventsCount,
      ApiDateTimeDto createdAt
  ) {
  }

  public record WorkspaceOwner(UUID id, String fullName, String email) {
  }

  public record WorkspaceSummary(
      UUID id,
      String name,
      String avatarUrl,
      ApiDateTimeDto createdAt
  ) {
  }
}
