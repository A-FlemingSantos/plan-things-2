package com.planthings.api.workspace;

import com.planthings.api.common.api.ApiEnvelope;
import org.springframework.web.bind.annotation.GetMapping;
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
}
