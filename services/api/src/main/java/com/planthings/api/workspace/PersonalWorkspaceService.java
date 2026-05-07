package com.planthings.api.workspace;

import com.planthings.api.auth.UserEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PersonalWorkspaceService {

  private final WorkspaceRepository workspaceRepository;

  public PersonalWorkspaceService(WorkspaceRepository workspaceRepository) {
    this.workspaceRepository = workspaceRepository;
  }

  @Transactional
  public WorkspaceEntity getOrCreate(UserEntity user) {
    return workspaceRepository.findByOwnerUserId(user.getId())
        .orElseGet(() -> createWorkspace(user));
  }

  private WorkspaceEntity createWorkspace(UserEntity user) {
    WorkspaceEntity workspace = new WorkspaceEntity();
    workspace.setOwnerUserId(user.getId());
    workspace.setName("Workspace de " + user.getFullName().trim());
    workspace.setSubscriptionPlan(WorkspaceSubscriptionPlan.BASIC);
    return workspaceRepository.save(workspace);
  }
}
