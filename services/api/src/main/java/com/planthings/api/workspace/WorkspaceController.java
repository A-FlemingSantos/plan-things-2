package com.planthings.api.workspace;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspace")
public class WorkspaceController {

  private final WorkspaceService workspaceService;

  public WorkspaceController(WorkspaceService workspaceService) {
    this.workspaceService = workspaceService;
  }

  @GetMapping
  public ApiEnvelope<WorkspaceService.WorkspaceDashboard> getCurrentWorkspace() {
    return ApiEnvelope.ok(workspaceService.getCurrentWorkspace());
  }

  @PatchMapping
  public ApiEnvelope<WorkspaceService.WorkspaceSummary> updateCurrentWorkspace(
      @Valid @RequestBody UpdateWorkspaceRequest request
  ) {
    return ApiEnvelope.ok(workspaceService.updateCurrentWorkspaceName(request.name()));
  }

  public record UpdateWorkspaceRequest(
      @NotBlank(message = "O nome do workspace e obrigatorio.") String name
  ) {
  }
}
