package com.planthings.api.docs;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
@RequestMapping("/api/documents")
public class DocumentController {

  private final DocumentService documentService;

  public DocumentController(DocumentService documentService) {
    this.documentService = documentService;
  }

  @GetMapping
  public ApiEnvelope<List<DocumentService.DocumentSummary>> listDocuments() {
    return ApiEnvelope.ok(documentService.listAccessibleDocuments());
  }

  @PostMapping
  public ApiEnvelope<DocumentService.DocumentDetails> createDocument(
      @RequestBody CreateDocumentRequest request
  ) {
    return ApiEnvelope.ok(documentService.createDocument(request.title(), request.description(), request.contentMarkdown()));
  }

  @GetMapping("/{documentId}")
  public ApiEnvelope<DocumentService.DocumentDetails> getDocument(@PathVariable UUID documentId) {
    return ApiEnvelope.ok(documentService.getDocument(documentId));
  }

  @PatchMapping("/{documentId}")
  public ApiEnvelope<DocumentService.DocumentDetails> updateDocument(
      @PathVariable UUID documentId,
      @Valid @RequestBody UpdateDocumentRequest request
  ) {
    return ApiEnvelope.ok(documentService.updateDocument(
        documentId,
        request.title(),
        request.description(),
        request.contentMarkdown(),
        request.expectedVersion()
    ));
  }

  @PostMapping("/{documentId}/duplicate")
  public ApiEnvelope<DocumentService.DocumentDetails> duplicateDocument(@PathVariable UUID documentId) {
    return ApiEnvelope.ok(documentService.duplicateDocument(documentId));
  }

  @DeleteMapping("/{documentId}")
  public ApiEnvelope<DocumentService.MessageResponse> deleteDocument(@PathVariable UUID documentId) {
    return ApiEnvelope.ok(documentService.deleteDocument(documentId));
  }

  @GetMapping("/{documentId}/members")
  public ApiEnvelope<List<DocumentService.MemberSummary>> listMembers(@PathVariable UUID documentId) {
    return ApiEnvelope.ok(documentService.listMembers(documentId));
  }

  @PostMapping("/{documentId}/invites")
  public ApiEnvelope<DocumentService.InviteResponse> inviteMember(
      @PathVariable UUID documentId,
      @Valid @RequestBody InviteRequest request
  ) {
    return ApiEnvelope.ok(documentService.inviteMember(documentId, request.email(), request.role()));
  }

  @PatchMapping("/{documentId}/members/{memberUserId}")
  public ApiEnvelope<DocumentService.MemberSummary> updateMemberRole(
      @PathVariable UUID documentId,
      @PathVariable UUID memberUserId,
      @Valid @RequestBody UpdateMemberRoleRequest request
  ) {
    return ApiEnvelope.ok(documentService.updateMemberRole(documentId, memberUserId, request.role()));
  }

  @DeleteMapping("/{documentId}/members/{memberUserId}")
  public ApiEnvelope<DocumentService.MessageResponse> removeMember(
      @PathVariable UUID documentId,
      @PathVariable UUID memberUserId
  ) {
    return ApiEnvelope.ok(documentService.removeMember(documentId, memberUserId));
  }

  @GetMapping("/invites/{token}")
  public ApiEnvelope<DocumentService.InvitePreviewResponse> getInvitePreview(@PathVariable String token) {
    return ApiEnvelope.ok(documentService.getInvitePreview(token));
  }

  @PostMapping("/invites/{token}/accept")
  public ApiEnvelope<DocumentService.AcceptInviteResponse> acceptInvite(@PathVariable String token) {
    return ApiEnvelope.ok(documentService.acceptInvite(token));
  }

  @PostMapping("/invites/{token}/decline")
  public ApiEnvelope<DocumentService.MessageResponse> declineInvite(@PathVariable String token) {
    return ApiEnvelope.ok(documentService.declineInvite(token));
  }

  @GetMapping("/{documentId}/comments")
  public ApiEnvelope<List<DocumentService.CommentSummary>> listComments(@PathVariable UUID documentId) {
    return ApiEnvelope.ok(documentService.listComments(documentId));
  }

  @PostMapping("/{documentId}/comments")
  public ApiEnvelope<DocumentService.CommentSummary> createComment(
      @PathVariable UUID documentId,
      @Valid @RequestBody CreateCommentRequest request
  ) {
    return ApiEnvelope.ok(documentService.createComment(
        documentId,
        request.body(),
        request.quotedText(),
        request.selectionStart(),
        request.selectionEnd()
    ));
  }

  @DeleteMapping("/{documentId}/comments/{commentId}")
  public ApiEnvelope<DocumentService.MessageResponse> deleteComment(
      @PathVariable UUID documentId,
      @PathVariable UUID commentId
  ) {
    return ApiEnvelope.ok(documentService.deleteComment(documentId, commentId));
  }

  public record CreateDocumentRequest(String title, String description, String contentMarkdown) {
  }

  public record UpdateDocumentRequest(
      String title,
      String description,
      String contentMarkdown,
      @NotNull(message = "A versão esperada é obrigatória.") Long expectedVersion
  ) {
  }

  public record InviteRequest(
      @NotBlank(message = "O e-mail é obrigatório.")
      @Email(message = "Informe um e-mail válido.") String email,
      @NotNull(message = "O papel é obrigatório.") DocumentRole role
  ) {
  }

  public record UpdateMemberRoleRequest(@NotNull DocumentRole role) {
  }

  public record CreateCommentRequest(
      @NotBlank(message = "O comentário é obrigatório.") String body,
      @NotBlank(message = "O trecho é obrigatório.") String quotedText,
      int selectionStart,
      int selectionEnd
  ) {
  }
}
