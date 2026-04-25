package com.planthings.api.plans;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/plans")
public class PlanController {

  private final PlanService planService;

  public PlanController(PlanService planService) {
    this.planService = planService;
  }

  @GetMapping
  public ApiEnvelope<List<PlanService.PlanSummary>> listPlans() {
    return ApiEnvelope.ok(planService.listAccessiblePlans());
  }

  @GetMapping("/{planId}")
  public ApiEnvelope<PlanService.PlanDetails> getPlan(@PathVariable UUID planId) {
    return ApiEnvelope.ok(planService.getPlan(planId));
  }

  @PostMapping
  public ApiEnvelope<PlanService.PlanDetails> createPlan(@Valid @RequestBody UpsertPlanRequest request) {
    return ApiEnvelope.ok(planService.createPlan(
        request.name(),
        request.description(),
        request.coverThemeId(),
        request.cover(),
        request.coverImageId()
    ));
  }

  @PatchMapping("/{planId}")
  public ApiEnvelope<PlanService.PlanDetails> updatePlan(@PathVariable UUID planId, @Valid @RequestBody UpsertPlanRequest request) {
    return ApiEnvelope.ok(planService.updatePlan(
        planId,
        request.name(),
        request.description(),
        request.coverThemeId(),
        request.cover(),
        request.coverImageId()
    ));
  }

  @DeleteMapping("/{planId}")
  public ApiEnvelope<PlanService.MessageResponse> deletePlan(@PathVariable UUID planId) {
    return ApiEnvelope.ok(planService.deletePlan(planId));
  }

  @GetMapping("/{planId}/members")
  public ApiEnvelope<List<PlanService.MemberSummary>> listMembers(@PathVariable UUID planId) {
    return ApiEnvelope.ok(planService.listMembers(planId));
  }

  @PostMapping("/{planId}/invites")
  public ApiEnvelope<PlanService.InviteResponse> inviteMember(@PathVariable UUID planId, @Valid @RequestBody InviteRequest request) {
    return ApiEnvelope.ok(planService.inviteMember(planId, request.email()));
  }

  @GetMapping("/{planId}/invites")
  public ApiEnvelope<List<PlanService.InviteResponse>> listInvites(@PathVariable UUID planId) {
    return ApiEnvelope.ok(planService.listInvites(planId));
  }

  @GetMapping("/invites/pending")
  public ApiEnvelope<List<PlanService.InvitePreviewResponse>> listPendingInvites() {
    return ApiEnvelope.ok(planService.listPendingInvitesForCurrentUser());
  }

  @GetMapping("/invites/{token}")
  public ApiEnvelope<PlanService.InvitePreviewResponse> getInvite(@PathVariable String token) {
    return ApiEnvelope.ok(planService.getInvitePreview(token));
  }

  @PostMapping("/{planId}/invites/{inviteId}/revoke")
  public ApiEnvelope<PlanService.MessageResponse> revokeInvite(@PathVariable UUID planId, @PathVariable UUID inviteId) {
    return ApiEnvelope.ok(planService.revokeInvite(planId, inviteId));
  }

  @PostMapping("/invites/{token}/accept")
  public ApiEnvelope<PlanService.AcceptInviteResponse> acceptInvite(@PathVariable String token) {
    return ApiEnvelope.ok(planService.acceptInvite(token));
  }

  @PostMapping("/invites/{token}/decline")
  public ApiEnvelope<PlanService.MessageResponse> declineInvite(@PathVariable String token) {
    return ApiEnvelope.ok(planService.declineInvite(token));
  }

  @DeleteMapping("/{planId}/members/{memberUserId}")
  public ApiEnvelope<PlanService.MessageResponse> removeMember(@PathVariable UUID planId, @PathVariable UUID memberUserId) {
    return ApiEnvelope.ok(planService.removeMember(planId, memberUserId));
  }

  @GetMapping("/{planId}/labels")
  public ApiEnvelope<List<PlanService.LabelSummary>> listLabels(@PathVariable UUID planId) {
    return ApiEnvelope.ok(planService.listLabels(planId));
  }

  @PostMapping("/{planId}/labels")
  public ApiEnvelope<PlanService.LabelSummary> createLabel(@PathVariable UUID planId, @Valid @RequestBody CreateLabelRequest request) {
    return ApiEnvelope.ok(planService.createLabel(planId, request.name(), request.color()));
  }

  public record UpsertPlanRequest(
      @NotBlank(message = "O nome do plano e obrigatorio.") String name,
      String description,
      String coverThemeId,
      String cover,
      String coverImageId
  ) {
  }

  public record InviteRequest(
      @NotBlank(message = "O e-mail e obrigatorio.")
      @Email(message = "Informe um e-mail valido.") String email
  ) {
  }

  public record CreateLabelRequest(
      @NotBlank(message = "O nome da etiqueta e obrigatorio.") String name,
      String color
  ) {
  }
}
