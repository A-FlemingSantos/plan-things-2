package com.planthings.api.workspace;

import com.planthings.api.common.api.ApiEnvelope;
import com.planthings.api.common.error.BadRequestException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Locale;
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

  @PatchMapping("/subscription")
  public ApiEnvelope<WorkspaceService.WorkspaceSummary> updateCurrentWorkspaceSubscription(
      @Valid @RequestBody UpdateWorkspaceSubscriptionRequest request
  ) {
    return ApiEnvelope.ok(workspaceService.updateCurrentWorkspaceSubscriptionPlan(parseSubscriptionPlan(request.subscriptionPlan())));
  }

  @PatchMapping("/icon")
  public ApiEnvelope<WorkspaceService.WorkspaceSummary> updateCurrentWorkspaceIcon(
      @Valid @RequestBody UpdateWorkspaceIconRequest request
  ) {
    return ApiEnvelope.ok(workspaceService.updateCurrentWorkspaceIcon(parseIconKey(request.iconKey())));
  }

  public record UpdateWorkspaceRequest(
      @NotBlank(message = "O nome do workspace e obrigatorio.") String name
  ) {
  }

  public record UpdateWorkspaceSubscriptionRequest(
      @NotBlank(message = "Selecione um plano valido.") String subscriptionPlan
  ) {
  }

  public record UpdateWorkspaceIconRequest(
      @NotBlank(message = "Selecione um icone valido.") String iconKey
  ) {
  }

  private WorkspaceSubscriptionPlan parseSubscriptionPlan(String value) {
    String normalized = value == null ? "" : value.trim().toUpperCase();
    if (normalized.isBlank()) {
      throw new BadRequestException("PLANO_INVALIDO", "Selecione um plano valido.");
    }

    try {
      return WorkspaceSubscriptionPlan.valueOf(normalized);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("PLANO_INVALIDO", "Selecione um plano valido.");
    }
  }

  private WorkspaceIconKey parseIconKey(String value) {
    String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    if (normalized.isBlank()) {
      throw new BadRequestException("ICONE_WORKSPACE_INVALIDO", "Selecione um icone valido.");
    }

    try {
      return WorkspaceIconKey.valueOf(normalized);
    } catch (IllegalArgumentException ex) {
      throw new BadRequestException("ICONE_WORKSPACE_INVALIDO", "Selecione um icone valido.");
    }
  }
}
