package com.planthings.api.workspace;

import com.planthings.api.common.api.ApiEnvelope;
import com.planthings.api.avatar.AvatarImageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

  @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiEnvelope<WorkspaceService.WorkspaceSummary> uploadCurrentWorkspaceAvatar(@RequestPart("file") MultipartFile file) {
    return ApiEnvelope.ok(workspaceService.uploadCurrentWorkspaceAvatar(file));
  }

  @DeleteMapping("/avatar")
  public ApiEnvelope<WorkspaceService.WorkspaceSummary> removeCurrentWorkspaceAvatar() {
    return ApiEnvelope.ok(workspaceService.removeCurrentWorkspaceAvatar());
  }

  @GetMapping("/avatar")
  public ResponseEntity<byte[]> getCurrentWorkspaceAvatar() {
    AvatarImageService.AvatarDownload avatar = workspaceService.getCurrentWorkspaceAvatar();
    return ResponseEntity.ok()
        .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
        .contentType(MediaType.parseMediaType(avatar.mimeType()))
        .body(avatar.content());
  }

  public record UpdateWorkspaceRequest(
      @NotBlank(message = "O nome do workspace e obrigatorio.") String name
  ) {
  }
}
