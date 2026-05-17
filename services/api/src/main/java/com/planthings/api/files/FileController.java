package com.planthings.api.files;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotBlank;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api/files")
public class FileController {

  private final FileService fileService;

  public FileController(FileService fileService) {
    this.fileService = fileService;
  }

  @GetMapping
  public ApiEnvelope<List<FileService.FileItemView>> listFiles(@RequestParam(defaultValue = "false") boolean trash) {
    return ApiEnvelope.ok(fileService.listPersonalFiles(trash));
  }

  @GetMapping("/plans/{planId}")
  public ApiEnvelope<List<FileService.FileItemView>> listPlanFiles(@PathVariable UUID planId) {
    return ApiEnvelope.ok(fileService.listPlanFiles(planId));
  }

  @PostMapping("/folders")
  public ApiEnvelope<FileService.FileItemView> createFolder(@RequestParam String name, @RequestParam(required = false) UUID parentId) {
    return ApiEnvelope.ok(fileService.createFolder(name, parentId));
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiEnvelope<FileService.FileItemView> upload(@RequestPart("file") MultipartFile file, @RequestParam(required = false) UUID parentId) {
    return ApiEnvelope.ok(fileService.upload(file, parentId));
  }

  @PostMapping(value = "/upload/attach/cards/{cardId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiEnvelope<FileService.CardAttachmentView> uploadAndAttachToCard(@RequestPart("file") MultipartFile file, @PathVariable UUID cardId) {
    return ApiEnvelope.ok(fileService.uploadAndAttachToCard(file, cardId));
  }

  @GetMapping("/{fileId}/download")
  public void download(@PathVariable UUID fileId, HttpServletResponse response) throws Exception {
    FileService.DownloadedFile file = fileService.download(fileId);
    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + java.net.URLEncoder.encode(file.name(), StandardCharsets.UTF_8));
    response.setContentType(file.mimeType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : file.mimeType());
    response.getOutputStream().write(file.content());
    response.flushBuffer();
  }

  @DeleteMapping("/{fileId}")
  public ApiEnvelope<FileService.MessageResponse> delete(@PathVariable UUID fileId) {
    return ApiEnvelope.ok(fileService.delete(fileId));
  }

  @DeleteMapping("/{fileId}/permanent")
  public ApiEnvelope<FileService.MessageResponse> permanentlyDelete(@PathVariable UUID fileId) {
    return ApiEnvelope.ok(fileService.permanentlyDelete(fileId));
  }

  @PostMapping("/{fileId}/restore")
  public ApiEnvelope<FileService.MessageResponse> restore(@PathVariable UUID fileId) {
    return ApiEnvelope.ok(fileService.restore(fileId));
  }

  @PostMapping("/{fileId}/favorite")
  public ApiEnvelope<FileService.FileItemView> favorite(@PathVariable UUID fileId) {
    return ApiEnvelope.ok(fileService.favorite(fileId));
  }

  @PostMapping("/{fileId}/unfavorite")
  public ApiEnvelope<FileService.FileItemView> unfavorite(@PathVariable UUID fileId) {
    return ApiEnvelope.ok(fileService.unfavorite(fileId));
  }

  @PostMapping("/{fileId}/share/plans/{planId}")
  public ApiEnvelope<FileService.MessageResponse> shareToPlan(@PathVariable UUID fileId, @PathVariable UUID planId) {
    return ApiEnvelope.ok(fileService.shareToPlan(fileId, planId));
  }

  @DeleteMapping("/{fileId}/share/plans/{planId}")
  public ApiEnvelope<FileService.MessageResponse> unshareFromPlan(@PathVariable UUID fileId, @PathVariable UUID planId) {
    return ApiEnvelope.ok(fileService.unshareFromPlan(fileId, planId));
  }

  @PostMapping("/{fileId}/attach/cards/{cardId}")
  public ApiEnvelope<FileService.CardAttachmentView> attachToCard(@PathVariable UUID fileId, @PathVariable UUID cardId) {
    return ApiEnvelope.ok(fileService.attachToCard(fileId, cardId));
  }

  @DeleteMapping("/attachments/{attachmentId}")
  public ApiEnvelope<FileService.MessageResponse> removeAttachment(@PathVariable UUID attachmentId) {
    return ApiEnvelope.ok(fileService.removeAttachment(attachmentId));
  }
}
