package com.planthings.api.workspace;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.calendar.CalendarEventRepository;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.files.FileEntryRepository;
import com.planthings.api.plans.PlanMemberRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceService {

  private final PersonalWorkspaceService personalWorkspaceService;
  private final PlanMemberRepository planMemberRepository;
  private final FileEntryRepository fileEntryRepository;
  private final CalendarEventRepository calendarEventRepository;
  private final AuthenticatedUserService authenticatedUserService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;

  public WorkspaceService(
      PersonalWorkspaceService personalWorkspaceService,
      PlanMemberRepository planMemberRepository,
      FileEntryRepository fileEntryRepository,
      CalendarEventRepository calendarEventRepository,
      AuthenticatedUserService authenticatedUserService,
      BrazilDateTimeMapper brazilDateTimeMapper
  ) {
    this.personalWorkspaceService = personalWorkspaceService;
    this.planMemberRepository = planMemberRepository;
    this.fileEntryRepository = fileEntryRepository;
    this.calendarEventRepository = calendarEventRepository;
    this.authenticatedUserService = authenticatedUserService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
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
        new WorkspaceOwner(currentUser.getId(), currentUser.getFullName(), currentUser.getEmail()),
        plansCount,
        fileCount,
        eventCount,
        brazilDateTimeMapper.toDateTime(workspace.getCreatedAt())
    );
  }

  public record WorkspaceDashboard(
      UUID id,
      String name,
      WorkspaceOwner owner,
      long plansCount,
      long personalFilesCount,
      long standaloneEventsCount,
      ApiDateTimeDto createdAt
  ) {
  }

  public record WorkspaceOwner(UUID id, String fullName, String email) {
  }
}
