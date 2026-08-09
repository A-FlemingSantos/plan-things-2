package com.planthings.api.docs;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.avatar.AvatarImageService;
import com.planthings.api.avatar.AvatarOwnerType;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ConflictException;
import com.planthings.api.common.error.ForbiddenException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentService {

  private static final int MAX_MARKDOWN_LENGTH = 1_000_000;

  private final DocumentRepository documentRepository;
  private final DocumentMemberRepository documentMemberRepository;
  private final DocumentInviteRepository documentInviteRepository;
  private final DocumentCommentRepository documentCommentRepository;
  private final UserRepository userRepository;
  private final AvatarImageService avatarImageService;
  private final AuthenticatedUserService authenticatedUserService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final DocumentInviteEmailSender documentInviteEmailSender;
  private final Clock clock;
  private final String frontendBaseUrl;

  public DocumentService(
      DocumentRepository documentRepository,
      DocumentMemberRepository documentMemberRepository,
      DocumentInviteRepository documentInviteRepository,
      DocumentCommentRepository documentCommentRepository,
      UserRepository userRepository,
      AvatarImageService avatarImageService,
      AuthenticatedUserService authenticatedUserService,
      BrazilDateTimeMapper brazilDateTimeMapper,
      DocumentInviteEmailSender documentInviteEmailSender,
      Clock clock,
      @Value("${app.frontend-base-url}") String frontendBaseUrl
  ) {
    this.documentRepository = documentRepository;
    this.documentMemberRepository = documentMemberRepository;
    this.documentInviteRepository = documentInviteRepository;
    this.documentCommentRepository = documentCommentRepository;
    this.userRepository = userRepository;
    this.avatarImageService = avatarImageService;
    this.authenticatedUserService = authenticatedUserService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.documentInviteEmailSender = documentInviteEmailSender;
    this.clock = clock;
    this.frontendBaseUrl = normalizeFrontendBaseUrl(frontendBaseUrl);
  }

  public List<DocumentSummary> listAccessibleDocuments() {
    UUID currentUserId = authenticatedUserService.requireUserId();
    Set<UUID> documentIds = documentMemberRepository.findByUserId(currentUserId).stream()
        .map(DocumentMemberEntity::getDocumentId)
        .collect(Collectors.toSet());
    if (documentIds.isEmpty()) {
      return List.of();
    }
    return documentRepository.findByIdInOrderByUpdatedAtDesc(documentIds).stream()
        .map(document -> toSummary(document, currentUserId))
        .toList();
  }

  public DocumentDetails getDocument(UUID documentId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    DocumentEntity document = requireAccessibleDocument(documentId, currentUserId);
    return toDetails(document, currentUserId);
  }

  @Transactional
  public DocumentDetails createDocument(String title, String description, String contentMarkdown) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    DocumentEntity document = new DocumentEntity();
    document.setOwnerUserId(currentUser.getId());
    document.setUpdatedByUserId(currentUser.getId());
    document.setTitle(normalizeTitle(title));
    document.setDescription(normalizeOptional(description));
    document.setContentMarkdown(normalizeMarkdown(contentMarkdown));
    document.setVersionNumber(1);
    documentRepository.save(document);

    DocumentMemberEntity owner = new DocumentMemberEntity();
    owner.setDocumentId(document.getId());
    owner.setUserId(currentUser.getId());
    owner.setRole(DocumentRole.OWNER);
    documentMemberRepository.save(owner);
    return toDetails(document, currentUser.getId());
  }

  @Transactional
  public DocumentDetails updateDocument(
      UUID documentId,
      String title,
      String description,
      String contentMarkdown,
      String coverImageId,
      long expectedVersion
  ) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    DocumentEntity document = requireEditor(documentId, currentUserId);
    if (expectedVersion != document.getVersionNumber()) {
      throw new ConflictException(
          "VERSAO_DESATUALIZADA",
          "Este documento foi alterado por outra pessoa. Atualize a página antes de salvar novamente."
      );
    }

    document.setTitle(normalizeTitle(title));
    document.setDescription(normalizeOptional(description));
    document.setContentMarkdown(normalizeMarkdown(contentMarkdown));
    document.setCoverImageId(normalizeCoverImageId(coverImageId));
    document.setUpdatedByUserId(currentUserId);
    document.setVersionNumber(document.getVersionNumber() + 1);
    documentRepository.save(document);
    return toDetails(document, currentUserId);
  }

  @Transactional
  public DocumentDetails duplicateDocument(UUID documentId) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    DocumentEntity source = requireAccessibleDocument(documentId, currentUser.getId());
    DocumentEntity copy = new DocumentEntity();
    copy.setOwnerUserId(currentUser.getId());
    copy.setUpdatedByUserId(currentUser.getId());
    copy.setTitle(source.getTitle() + " (cópia)");
    copy.setDescription(source.getDescription());
    copy.setContentMarkdown(source.getContentMarkdown());
    copy.setCoverImageId(source.getCoverImageId());
    copy.setVersionNumber(1);
    documentRepository.save(copy);

    DocumentMemberEntity owner = new DocumentMemberEntity();
    owner.setDocumentId(copy.getId());
    owner.setUserId(currentUser.getId());
    owner.setRole(DocumentRole.OWNER);
    documentMemberRepository.save(owner);
    return toDetails(copy, currentUser.getId());
  }

  @Transactional
  public MessageResponse deleteDocument(UUID documentId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    DocumentEntity document = requireAccessibleDocument(documentId, currentUserId);
    if (!document.getOwnerUserId().equals(currentUserId)) {
      throw new ForbiddenException("APENAS_OWNER", "Somente o proprietário pode excluir este documento.");
    }
    documentRepository.delete(document);
    return new MessageResponse("Documento excluído com sucesso.");
  }

  public List<MemberSummary> listMembers(UUID documentId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    requireAccessibleDocument(documentId, currentUserId);
    return membersFor(documentId);
  }

  @Transactional
  public InviteResponse inviteMember(UUID documentId, String email, DocumentRole role) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    requireOwner(documentId, currentUser.getId());
    String normalizedEmail = normalizeEmail(email);
    DocumentRole inviteRole = requireInviteRole(role);

    documentInviteRepository.findByDocumentIdAndInvitedEmailIgnoreCaseAndStatus(
        documentId,
        normalizedEmail,
        DocumentInviteStatus.PENDING
    ).ifPresent(invite -> {
      throw new ConflictException("CONVITE_PENDENTE", "Já existe um convite pendente para este e-mail.");
    });

    userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(user -> {
      if (documentMemberRepository.existsByDocumentIdAndUserId(documentId, user.getId())) {
        throw new ConflictException("USUARIO_JA_E_MEMBRO", "Este usuário já tem acesso ao documento.");
      }
    });

    DocumentInviteEntity invite = new DocumentInviteEntity();
    invite.setDocumentId(documentId);
    invite.setInviterUserId(currentUser.getId());
    invite.setInvitedEmail(normalizedEmail);
    invite.setRole(inviteRole);
    invite.setToken(UUID.randomUUID().toString());
    invite.setStatus(DocumentInviteStatus.PENDING);
    invite.setExpiresAt(OffsetDateTime.now(clock).plusDays(7));
    // Doc invites always persist so the owner can share a copyable link even when
    // Gmail is missing, expired, missing scopes, or fails to send.
    DocumentInviteEmailSender.Delivery delivery;
    try {
      delivery = documentInviteEmailSender.sendInvite(
          currentUser,
          normalizedEmail,
          documentRepository.findById(documentId)
              .map(DocumentEntity::getTitle)
              .orElseThrow(() -> new NotFoundException("DOCUMENTO_NAO_ENCONTRADO", "Documento não encontrado.")),
          buildInviteUrl(invite.getToken())
      );
    } catch (BadRequestException ignored) {
      delivery = new DocumentInviteEmailSender.Delivery(false, normalizedEmail, null);
    }
    documentInviteRepository.save(invite);
    return toInviteResponse(invite, delivery);
  }

  @Transactional
  public InvitePreviewResponse getInvitePreview(String token) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    DocumentInviteEntity invite = requireInviteForEmail(token, currentUser);
    expireIfNeeded(invite);
    DocumentEntity document = documentRepository.findById(invite.getDocumentId())
        .orElseThrow(() -> new NotFoundException("DOCUMENTO_NAO_ENCONTRADO", "Documento não encontrado."));
    return new InvitePreviewResponse(
        invite.getId(),
        document.getId(),
        document.getTitle(),
        invite.getInvitedEmail(),
        invite.getRole(),
        invite.getStatus(),
        invite.getToken(),
        brazilDateTimeMapper.toDateTime(invite.getExpiresAt())
    );
  }

  @Transactional
  public AcceptInviteResponse acceptInvite(String token) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    DocumentInviteEntity invite = requireInviteForEmail(token, currentUser);
    requirePendingInvite(invite);

    if (!documentMemberRepository.existsByDocumentIdAndUserId(invite.getDocumentId(), currentUser.getId())) {
      DocumentMemberEntity member = new DocumentMemberEntity();
      member.setDocumentId(invite.getDocumentId());
      member.setUserId(currentUser.getId());
      member.setRole(invite.getRole());
      documentMemberRepository.save(member);
    }
    invite.setStatus(DocumentInviteStatus.ACCEPTED);
    invite.setRespondedAt(OffsetDateTime.now(clock));
    documentInviteRepository.save(invite);
    return new AcceptInviteResponse(invite.getDocumentId(), "Convite aceito com sucesso.");
  }

  @Transactional
  public MessageResponse declineInvite(String token) {
    UserEntity currentUser = authenticatedUserService.requireUser();
    DocumentInviteEntity invite = requireInviteForEmail(token, currentUser);
    requirePendingInvite(invite);
    invite.setStatus(DocumentInviteStatus.DECLINED);
    invite.setRespondedAt(OffsetDateTime.now(clock));
    documentInviteRepository.save(invite);
    return new MessageResponse("Convite recusado com sucesso.");
  }

  @Transactional
  public MemberSummary updateMemberRole(UUID documentId, UUID memberUserId, DocumentRole role) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    requireOwner(documentId, currentUserId);
    DocumentRole nextRole = requireInviteRole(role);
    DocumentMemberEntity member = documentMemberRepository.findByDocumentIdAndUserId(documentId, memberUserId)
        .orElseThrow(() -> new NotFoundException("MEMBRO_NAO_ENCONTRADO", "Membro não encontrado."));
    if (member.getRole() == DocumentRole.OWNER) {
      throw new BadRequestException("OWNER_NAO_PODE_SER_ALTERADO", "O cargo do proprietário não pode ser alterado.");
    }
    member.setRole(nextRole);
    documentMemberRepository.save(member);
    return toMemberSummary(member);
  }

  @Transactional
  public MessageResponse removeMember(UUID documentId, UUID memberUserId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    requireOwner(documentId, currentUserId);
    DocumentMemberEntity member = documentMemberRepository.findByDocumentIdAndUserId(documentId, memberUserId)
        .orElseThrow(() -> new NotFoundException("MEMBRO_NAO_ENCONTRADO", "Membro não encontrado."));
    if (member.getRole() == DocumentRole.OWNER) {
      throw new BadRequestException("OWNER_NAO_PODE_SER_REMOVIDO", "O proprietário não pode ser removido.");
    }
    documentMemberRepository.delete(member);
    return new MessageResponse("Acesso removido com sucesso.");
  }

  public List<CommentSummary> listComments(UUID documentId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    requireAccessibleDocument(documentId, currentUserId);
    return documentCommentRepository.findByDocumentIdOrderByCreatedAtAsc(documentId).stream()
        .map(this::toCommentSummary)
        .toList();
  }

  @Transactional
  public CommentSummary createComment(
      UUID documentId,
      String body,
      String quotedText,
      int selectionStart,
      int selectionEnd
  ) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    requireAccessibleDocument(documentId, currentUserId);
    String normalizedBody = requireText(body, "COMENTARIO_OBRIGATORIO", "Escreva um comentário.", 4000);
    String normalizedQuote = requireText(quotedText, "TRECHO_OBRIGATORIO", "Selecione um trecho para comentar.", 1000);
    if (selectionStart < 0 || selectionEnd <= selectionStart) {
      throw new BadRequestException("INTERVALO_INVALIDO", "O intervalo selecionado é inválido.");
    }

    DocumentCommentEntity comment = new DocumentCommentEntity();
    comment.setDocumentId(documentId);
    comment.setAuthorUserId(currentUserId);
    comment.setBody(normalizedBody);
    comment.setQuotedText(normalizedQuote);
    comment.setSelectionStart(selectionStart);
    comment.setSelectionEnd(selectionEnd);
    documentCommentRepository.save(comment);
    return toCommentSummary(comment);
  }

  @Transactional
  public MessageResponse deleteComment(UUID documentId, UUID commentId) {
    UUID currentUserId = authenticatedUserService.requireUserId();
    DocumentEntity document = requireAccessibleDocument(documentId, currentUserId);
    DocumentCommentEntity comment = documentCommentRepository.findById(commentId)
        .filter(candidate -> candidate.getDocumentId().equals(documentId))
        .orElseThrow(() -> new NotFoundException("COMENTARIO_NAO_ENCONTRADO", "Comentário não encontrado."));
    if (!comment.getAuthorUserId().equals(currentUserId) && !document.getOwnerUserId().equals(currentUserId)) {
      throw new ForbiddenException("SEM_PERMISSAO", "Você não pode excluir este comentário.");
    }
    documentCommentRepository.delete(comment);
    return new MessageResponse("Comentário excluído com sucesso.");
  }

  private DocumentEntity requireAccessibleDocument(UUID documentId, UUID userId) {
    DocumentEntity document = documentRepository.findById(documentId)
        .orElseThrow(() -> new NotFoundException("DOCUMENTO_NAO_ENCONTRADO", "Documento não encontrado."));
    if (!documentMemberRepository.existsByDocumentIdAndUserId(documentId, userId)) {
      throw new ForbiddenException("SEM_ACESSO_AO_DOCUMENTO", "Você não tem acesso a este documento.");
    }
    return document;
  }

  private DocumentEntity requireEditor(UUID documentId, UUID userId) {
    DocumentEntity document = requireAccessibleDocument(documentId, userId);
    DocumentRole role = requireRole(documentId, userId);
    if (role == DocumentRole.VIEWER) {
      throw new ForbiddenException("SEM_PERMISSAO_DE_EDICAO", "Você não pode editar este documento.");
    }
    return document;
  }

  private void requireOwner(UUID documentId, UUID userId) {
    requireAccessibleDocument(documentId, userId);
    if (requireRole(documentId, userId) != DocumentRole.OWNER) {
      throw new ForbiddenException("APENAS_OWNER", "Somente o proprietário pode gerenciar o compartilhamento.");
    }
  }

  private DocumentRole requireRole(UUID documentId, UUID userId) {
    return documentMemberRepository.findByDocumentIdAndUserId(documentId, userId)
        .map(DocumentMemberEntity::getRole)
        .orElseThrow(() -> new ForbiddenException("SEM_ACESSO_AO_DOCUMENTO", "Você não tem acesso a este documento."));
  }

  private List<MemberSummary> membersFor(UUID documentId) {
    return documentMemberRepository.findByDocumentId(documentId).stream()
        .map(this::toMemberSummary)
        .sorted(Comparator.comparing(MemberSummary::fullName, String.CASE_INSENSITIVE_ORDER))
        .toList();
  }

  private DocumentSummary toSummary(DocumentEntity document, UUID currentUserId) {
    return new DocumentSummary(
        document.getId(),
        document.getTitle(),
        document.getDescription(),
        document.getCoverImageId(),
        requireRole(document.getId(), currentUserId),
        document.getVersionNumber(),
        brazilDateTimeMapper.toDateTime(document.getCreatedAt()),
        brazilDateTimeMapper.toDateTime(document.getUpdatedAt())
    );
  }

  private DocumentDetails toDetails(DocumentEntity document, UUID currentUserId) {
    UserEntity updatedBy = userRepository.findById(document.getUpdatedByUserId())
        .orElse(null);
    return new DocumentDetails(
        toSummary(document, currentUserId),
        document.getContentMarkdown(),
        new UserSummary(
            document.getOwnerUserId(),
            userRepository.findById(document.getOwnerUserId()).map(UserEntity::getFullName).orElse("Proprietário")
        ),
        updatedBy == null ? null : new UserSummary(updatedBy.getId(), updatedBy.getFullName()),
        membersFor(document.getId())
    );
  }

  private MemberSummary toMemberSummary(DocumentMemberEntity member) {
    UserEntity user = userRepository.findById(member.getUserId())
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Usuário não encontrado."));
    return new MemberSummary(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        avatarImageService.avatarUrlFor(AvatarOwnerType.USER, user.getId()),
        member.getRole(),
        brazilDateTimeMapper.toDateTime(member.getCreatedAt())
    );
  }

  private CommentSummary toCommentSummary(DocumentCommentEntity comment) {
    UserEntity author = userRepository.findById(comment.getAuthorUserId())
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Usuário não encontrado."));
    return new CommentSummary(
        comment.getId(),
        comment.getBody(),
        comment.getQuotedText(),
        comment.getSelectionStart(),
        comment.getSelectionEnd(),
        new UserSummary(author.getId(), author.getFullName()),
        brazilDateTimeMapper.toDateTime(comment.getCreatedAt())
    );
  }

  private InviteResponse toInviteResponse(DocumentInviteEntity invite, DocumentInviteEmailSender.Delivery delivery) {
    return new InviteResponse(
        invite.getId(),
        invite.getInvitedEmail(),
        invite.getRole(),
        invite.getStatus(),
        invite.getToken(),
        buildInviteUrl(invite.getToken()),
        brazilDateTimeMapper.toDateTime(invite.getExpiresAt()),
        new InviteDeliveryResponse(delivery.emailSent(), delivery.sentTo(), delivery.sentFrom())
    );
  }

  private DocumentInviteEntity requireInviteForEmail(String token, UserEntity user) {
    DocumentInviteEntity invite = documentInviteRepository.findByToken(token)
        .orElseThrow(() -> new NotFoundException("CONVITE_NAO_ENCONTRADO", "Convite não encontrado."));
    if (!invite.getInvitedEmail().equalsIgnoreCase(user.getEmail())) {
      throw new BadRequestException("EMAIL_DIFERENTE", "Este convite foi enviado para outro e-mail.");
    }
    return invite;
  }

  private void requirePendingInvite(DocumentInviteEntity invite) {
    expireIfNeeded(invite);
    if (invite.getStatus() != DocumentInviteStatus.PENDING) {
      throw new BadRequestException("CONVITE_INVALIDO", "Este convite não está mais disponível.");
    }
  }

  private void expireIfNeeded(DocumentInviteEntity invite) {
    if (invite.getStatus() == DocumentInviteStatus.PENDING && invite.getExpiresAt().isBefore(OffsetDateTime.now(clock))) {
      invite.setStatus(DocumentInviteStatus.EXPIRED);
      documentInviteRepository.save(invite);
    }
  }

  private DocumentRole requireInviteRole(DocumentRole role) {
    if (role == null || role == DocumentRole.OWNER) {
      throw new BadRequestException("CARGO_INVALIDO", "Convites devem conceder acesso de editor ou leitor.");
    }
    return role;
  }

  private String normalizeTitle(String value) {
    String normalized = value == null ? "" : value.trim();
    return normalized.isBlank() ? "Sem título" : normalized;
  }

  private String normalizeOptional(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private String normalizeMarkdown(String value) {
    String normalized = value == null ? "" : value.replace("\r\n", "\n");
    if (normalized.length() > MAX_MARKDOWN_LENGTH) {
      throw new BadRequestException("DOCUMENTO_MUITO_GRANDE", "O conteúdo do documento excede o limite permitido.");
    }
    return normalized;
  }

  private String normalizeCoverImageId(String value) {
    if (value == null) {
      return null;
    }
    String normalized = value.trim().replace("\\", "/");
    if (normalized.isBlank()) {
      return null;
    }
    if (normalized.length() > 255) {
      throw new BadRequestException("CAPA_INVALIDA", "A imagem de capa informada é inválida.");
    }
    if (normalized.startsWith("files/")) {
      return normalized;
    }
    if (normalized.startsWith("https://") || normalized.startsWith("http://")) {
      return normalized;
    }
    throw new BadRequestException("CAPA_INVALIDA", "A imagem de capa informada é inválida.");
  }

  private String requireText(String value, String code, String message, int maximumLength) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException(code, message);
    }
    if (normalized.length() > maximumLength) {
      throw new BadRequestException("TEXTO_MUITO_GRANDE", "O texto excede o limite permitido.");
    }
    return normalized;
  }

  private String normalizeEmail(String email) {
    String normalized = email == null ? "" : email.trim().toLowerCase();
    if (normalized.isBlank()) {
      throw new BadRequestException("EMAIL_OBRIGATORIO", "O e-mail é obrigatório.");
    }
    return normalized;
  }

  private String normalizeFrontendBaseUrl(String value) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.isBlank()) {
      throw new IllegalArgumentException("app.frontend-base-url must be configured.");
    }
    return normalized.replaceAll("/+$", "");
  }

  private String buildInviteUrl(String token) {
    return frontendBaseUrl + "/docs/invites/" + token;
  }

  public record DocumentSummary(
      UUID id,
      String title,
      String description,
      String coverImageId,
      DocumentRole role,
      long versionNumber,
      ApiDateTimeDto createdAt,
      ApiDateTimeDto updatedAt
  ) {
  }

  public record DocumentDetails(
      DocumentSummary document,
      String contentMarkdown,
      UserSummary owner,
      UserSummary updatedBy,
      List<MemberSummary> members
  ) {
  }

  public record UserSummary(UUID id, String fullName) {
  }

  public record MemberSummary(
      UUID userId,
      String fullName,
      String email,
      String avatarUrl,
      DocumentRole role,
      ApiDateTimeDto joinedAt
  ) {
  }

  public record InviteResponse(
      UUID inviteId,
      String invitedEmail,
      DocumentRole role,
      DocumentInviteStatus status,
      String token,
      String inviteUrl,
      ApiDateTimeDto expiresAt,
      InviteDeliveryResponse delivery
  ) {
  }

  public record InviteDeliveryResponse(boolean emailSent, String sentTo, String sentFrom) {
  }

  public record InvitePreviewResponse(
      UUID inviteId,
      UUID documentId,
      String documentTitle,
      String invitedEmail,
      DocumentRole role,
      DocumentInviteStatus status,
      String token,
      ApiDateTimeDto expiresAt
  ) {
  }

  public record AcceptInviteResponse(UUID documentId, String message) {
  }

  public record CommentSummary(
      UUID id,
      String body,
      String quotedText,
      int selectionStart,
      int selectionEnd,
      UserSummary author,
      ApiDateTimeDto createdAt
  ) {
  }

  public record MessageResponse(String message) {
  }
}
