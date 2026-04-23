package com.planthings.api.files;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ForbiddenException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.plans.PlanEntity;
import com.planthings.api.plans.PlanMemberRole;
import com.planthings.api.workspace.WorkspaceEntity;
import com.planthings.api.workspace.WorkspaceRepository;
import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {

  private final FileEntryRepository fileEntryRepository;
  private final FileBlobRepository fileBlobRepository;
  private final FilePlanShareRepository filePlanShareRepository;
  private final CardAttachmentRepository cardAttachmentRepository;
  private final WorkspaceRepository workspaceRepository;
  private final AuthenticatedUserService authenticatedUserService;
  private final PlanAccessService planAccessService;
  private final BoardCardRepository boardCardRepository;
  private final BrazilDateTimeMapper brazilDateTimeMapper;

  public FileService(
      FileEntryRepository fileEntryRepository,
      FileBlobRepository fileBlobRepository,
      FilePlanShareRepository filePlanShareRepository,
      CardAttachmentRepository cardAttachmentRepository,
      WorkspaceRepository workspaceRepository,
      AuthenticatedUserService authenticatedUserService,
      PlanAccessService planAccessService,
      BoardCardRepository boardCardRepository,
      BrazilDateTimeMapper brazilDateTimeMapper
  ) {
    this.fileEntryRepository = fileEntryRepository;
    this.fileBlobRepository = fileBlobRepository;
    this.filePlanShareRepository = filePlanShareRepository;
    this.cardAttachmentRepository = cardAttachmentRepository;
    this.workspaceRepository = workspaceRepository;
    this.authenticatedUserService = authenticatedUserService;
    this.planAccessService = planAccessService;
    this.boardCardRepository = boardCardRepository;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
  }

  public List<FileItemView> listPersonalFiles(boolean trash) {
    UserEntity user = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = requireWorkspace(user.getId());
    List<FileEntryEntity> files = trash
        ? fileEntryRepository.findByWorkspaceIdAndDeletedAtIsNotNullOrderByUpdatedAtDesc(workspace.getId())
        : fileEntryRepository.findByWorkspaceIdAndOwnerUserIdAndDeletedAtIsNullOrderByTypeAscNameAsc(workspace.getId(), user.getId());
    return files.stream().map(this::toView).toList();
  }

  public List<FileItemView> listPlanFiles(UUID planId) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    PlanMemberRole role = planAccessService.requireMemberRole(planId, userId);
    boolean canManagePlan = role == PlanMemberRole.OWNER || role == PlanMemberRole.ADMIN;
    return filePlanShareRepository.findByPlanId(planId).stream()
        .map(share -> {
          FileEntryEntity file = fileEntryRepository.findById(share.getFileEntryId())
              .orElseThrow(() -> new NotFoundException("ARQUIVO_NAO_ENCONTRADO", "Nao encontramos um arquivo compartilhado deste plano."));
          boolean sharedByCurrentUser = Objects.equals(share.getSharedByUserId(), userId);
          return new SharedFile(file, sharedByCurrentUser, canManagePlan || sharedByCurrentUser);
        })
        .filter(sharedFile -> sharedFile.file().getDeletedAt() == null)
        .map(sharedFile -> toView(sharedFile.file(), sharedFile.sharedByCurrentUser(), sharedFile.canUnshare()))
        .toList();
  }

  @Transactional
  public FileItemView createFolder(String name, UUID parentId) {
    UserEntity user = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = requireWorkspace(user.getId());
    validateParent(parentId, user.getId());

    FileEntryEntity folder = new FileEntryEntity();
    folder.setWorkspaceId(workspace.getId());
    folder.setOwnerUserId(user.getId());
    folder.setParentId(parentId);
    folder.setType(FileEntryType.FOLDER);
    folder.setName(requireName(name));
    fileEntryRepository.save(folder);
    return toView(folder);
  }

  @Transactional
  public FileItemView upload(MultipartFile multipartFile, UUID parentId) {
    UserEntity user = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = requireWorkspace(user.getId());
    validateParent(parentId, user.getId());

    try {
      if (multipartFile.isEmpty()) {
        throw new BadRequestException("ARQUIVO_VAZIO", "Selecione um arquivo valido para envio.");
      }

      FileEntryEntity file = new FileEntryEntity();
      file.setWorkspaceId(workspace.getId());
      file.setOwnerUserId(user.getId());
      file.setParentId(parentId);
      file.setType(FileEntryType.FILE);
      file.setName(requireName(multipartFile.getOriginalFilename()));
      file.setMimeType(multipartFile.getContentType());
      file.setSizeBytes(multipartFile.getSize());
      fileEntryRepository.save(file);

      FileBlobEntity blob = new FileBlobEntity();
      blob.setFileEntryId(file.getId());
      blob.setContent(multipartFile.getBytes());
      fileBlobRepository.save(blob);
      return toView(file);
    } catch (BadRequestException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new BadRequestException("FALHA_NO_UPLOAD", "Nao foi possivel enviar o arquivo informado.");
    }
  }

  public DownloadedFile download(UUID fileId) {
    UUID userId = authenticatedUserService.requireUserId();
    FileEntryEntity file = fileEntryRepository.findById(fileId)
        .orElseThrow(() -> new NotFoundException("ARQUIVO_NAO_ENCONTRADO", "Nao encontramos o arquivo informado."));

    if (!canAccessFile(file, userId)) {
      throw new ForbiddenException("ACESSO_AO_ARQUIVO_NEGADO", "Voce nao tem acesso a este arquivo.");
    }
    if (file.getType() != FileEntryType.FILE) {
      throw new BadRequestException("DOWNLOAD_INVALIDO", "Apenas arquivos podem ser baixados.");
    }

    FileBlobEntity blob = fileBlobRepository.findByFileEntryId(fileId)
        .orElseThrow(() -> new NotFoundException("CONTEUDO_NAO_ENCONTRADO", "Nao encontramos o conteudo binario deste arquivo."));

    return new DownloadedFile(file.getName(), file.getMimeType(), blob.getContent());
  }

  @Transactional
  public MessageResponse delete(UUID fileId) {
    UserEntity user = authenticatedUserService.requireUser();
    FileEntryEntity file = requireOwnedFile(fileId, user.getId());
    applySoftDeleteRecursively(file, user.getId());
    return new MessageResponse("Arquivo movido para a lixeira com sucesso.");
  }

  @Transactional
  public MessageResponse restore(UUID fileId) {
    UserEntity user = authenticatedUserService.requireUser();
    FileEntryEntity file = requireOwnedFile(fileId, user.getId());
    applyRestoreRecursively(file, user.getId());
    return new MessageResponse("Arquivo restaurado com sucesso.");
  }

  @Transactional
  public FileItemView favorite(UUID fileId) {
    UserEntity user = authenticatedUserService.requireUser();
    FileEntryEntity file = requireOwnedFile(fileId, user.getId());
    file.setStarred(true);
    fileEntryRepository.save(file);
    return toView(file);
  }

  @Transactional
  public FileItemView unfavorite(UUID fileId) {
    UserEntity user = authenticatedUserService.requireUser();
    FileEntryEntity file = requireOwnedFile(fileId, user.getId());
    file.setStarred(false);
    fileEntryRepository.save(file);
    return toView(file);
  }

  @Transactional
  public MessageResponse shareToPlan(UUID fileId, UUID planId) {
    UserEntity user = authenticatedUserService.requireUser();
    planAccessService.requirePlanMember(planId, user.getId());
    FileEntryEntity file = requireOwnedFile(fileId, user.getId());
    requireRegularFile(file);

    filePlanShareRepository.findByPlanIdAndFileEntryId(planId, fileId).ifPresentOrElse(
        share -> {
        },
        () -> {
          FilePlanShareEntity share = new FilePlanShareEntity();
          share.setFileEntryId(fileId);
          share.setPlanId(planId);
          share.setSharedByUserId(user.getId());
          filePlanShareRepository.save(share);
        }
    );

    return new MessageResponse("Arquivo compartilhado com o plano com sucesso.");
  }

  @Transactional
  public MessageResponse attachToCard(UUID fileId, UUID cardId) {
    UserEntity user = authenticatedUserService.requireUser();
    FileEntryEntity file = fileEntryRepository.findById(fileId)
        .orElseThrow(() -> new NotFoundException("ARQUIVO_NAO_ENCONTRADO", "Nao encontramos o arquivo informado."));
    requireRegularFile(file);
    BoardCardEntity card = boardCardRepository.findById(cardId)
        .orElseThrow(() -> new NotFoundException("CARTAO_NAO_ENCONTRADO", "Nao encontramos o cartao informado."));
    PlanEntity plan = planAccessService.requirePlanMember(card.getPlanId(), user.getId());
    boolean ownsFile = Objects.equals(file.getOwnerUserId(), user.getId());
    boolean sharedWithCardPlan = filePlanShareRepository.findByPlanIdAndFileEntryId(plan.getId(), file.getId()).isPresent();

    if (!ownsFile && !sharedWithCardPlan) {
      throw new ForbiddenException("ACESSO_AO_ARQUIVO_NEGADO", "Voce nao tem acesso a este arquivo neste plano.");
    }

    if (ownsFile) {
      filePlanShareRepository.findByPlanIdAndFileEntryId(plan.getId(), file.getId()).orElseGet(() -> {
        FilePlanShareEntity share = new FilePlanShareEntity();
        share.setFileEntryId(file.getId());
        share.setPlanId(plan.getId());
        share.setSharedByUserId(user.getId());
        return filePlanShareRepository.save(share);
      });
    }

    boolean alreadyAttached = cardAttachmentRepository.findByCardId(cardId).stream()
        .anyMatch(attachment -> attachment.getFileEntryId().equals(fileId));

    if (!alreadyAttached) {
      CardAttachmentEntity attachment = new CardAttachmentEntity();
      attachment.setCardId(cardId);
      attachment.setFileEntryId(fileId);
      attachment.setAttachedByUserId(user.getId());
      cardAttachmentRepository.save(attachment);
    }

    return new MessageResponse("Arquivo anexado ao cartao com sucesso.");
  }

  @Transactional
  public MessageResponse removeAttachment(UUID attachmentId) {
    UUID userId = authenticatedUserService.requireUserId();
    CardAttachmentEntity attachment = cardAttachmentRepository.findById(attachmentId)
        .orElseThrow(() -> new NotFoundException("ANEXO_NAO_ENCONTRADO", "Nao encontramos o anexo informado."));
    BoardCardEntity card = boardCardRepository.findById(attachment.getCardId())
        .orElseThrow(() -> new NotFoundException("CARTAO_NAO_ENCONTRADO", "Nao encontramos o cartao vinculado ao anexo."));
    planAccessService.requirePlanMember(card.getPlanId(), userId);

    if (!canManagePlanFiles(card.getPlanId(), userId) && !Objects.equals(attachment.getAttachedByUserId(), userId)) {
      throw new ForbiddenException("REMOCAO_DO_ANEXO_NEGADA", "Voce so pode remover anexos adicionados por voce.");
    }

    cardAttachmentRepository.delete(attachment);
    return new MessageResponse("Anexo removido do cartao com sucesso.");
  }

  @Transactional
  public MessageResponse unshareFromPlan(UUID fileId, UUID planId) {
    UUID userId = authenticatedUserService.requireUserId();
    planAccessService.requirePlanMember(planId, userId);
    FilePlanShareEntity share = filePlanShareRepository.findByPlanIdAndFileEntryId(planId, fileId)
        .orElseThrow(() -> new NotFoundException("COMPARTILHAMENTO_NAO_ENCONTRADO", "Este arquivo nao esta compartilhado com o plano."));

    if (!canManagePlanFiles(planId, userId) && !Objects.equals(share.getSharedByUserId(), userId)) {
      throw new ForbiddenException("REMOCAO_DO_COMPARTILHAMENTO_NEGADA", "Voce so pode descompartilhar arquivos adicionados por voce.");
    }

    List<CardAttachmentEntity> attachmentsInPlan = cardAttachmentRepository.findByFileEntryId(fileId).stream()
        .filter(attachment -> boardCardRepository.findById(attachment.getCardId())
            .map(card -> Objects.equals(card.getPlanId(), planId))
            .orElse(false))
        .toList();

    if (!attachmentsInPlan.isEmpty()) {
      cardAttachmentRepository.deleteAll(attachmentsInPlan);
    }

    filePlanShareRepository.delete(share);
    return new MessageResponse("Arquivo removido do plano com sucesso.");
  }

  private WorkspaceEntity requireWorkspace(UUID ownerUserId) {
    return workspaceRepository.findByOwnerUserId(ownerUserId)
        .orElseThrow(() -> new NotFoundException("WORKSPACE_NAO_ENCONTRADA", "Nao encontramos a workspace pessoal deste usuario."));
  }

  private void validateParent(UUID parentId, UUID ownerUserId) {
    if (parentId == null) {
      return;
    }
    FileEntryEntity parent = requireOwnedFile(parentId, ownerUserId);
    if (parent.getType() != FileEntryType.FOLDER) {
      throw new BadRequestException("PASTA_INVALIDA", "O destino informado nao e uma pasta.");
    }
  }

  private FileEntryEntity requireOwnedFile(UUID fileId, UUID ownerUserId) {
    FileEntryEntity file = fileEntryRepository.findById(fileId)
        .orElseThrow(() -> new NotFoundException("ARQUIVO_NAO_ENCONTRADO", "Nao encontramos o arquivo informado."));
    if (!Objects.equals(file.getOwnerUserId(), ownerUserId)) {
      throw new ForbiddenException("ARQUIVO_NAO_PERTENCE_AO_USUARIO", "Este arquivo nao pertence a sua biblioteca pessoal.");
    }
    return file;
  }

  private void requireRegularFile(FileEntryEntity file) {
    if (file.getDeletedAt() != null) {
      throw new NotFoundException("ARQUIVO_NAO_ENCONTRADO", "Nao encontramos o arquivo informado.");
    }
    if (file.getType() != FileEntryType.FILE) {
      throw new BadRequestException("ANEXO_INVALIDO", "Apenas arquivos podem ser compartilhados ou anexados.");
    }
  }

  private boolean canManagePlanFiles(UUID planId, UUID userId) {
    PlanMemberRole role = planAccessService.requireMemberRole(planId, userId);
    return role == PlanMemberRole.OWNER || role == PlanMemberRole.ADMIN;
  }

  private void applySoftDeleteRecursively(FileEntryEntity root, UUID ownerUserId) {
    OffsetDateTime deletedAt = OffsetDateTime.now();
    List<FileEntryEntity> subtree = collectSubtree(root, ownerUserId);
    subtree.forEach(file -> file.setDeletedAt(deletedAt));
    fileEntryRepository.saveAll(subtree);
  }

  private void applyRestoreRecursively(FileEntryEntity root, UUID ownerUserId) {
    List<FileEntryEntity> subtree = collectSubtree(root, ownerUserId);
    subtree.forEach(file -> file.setDeletedAt(null));
    fileEntryRepository.saveAll(subtree);
  }

  private List<FileEntryEntity> collectSubtree(FileEntryEntity root, UUID ownerUserId) {
    List<FileEntryEntity> ownedFiles = fileEntryRepository.findByWorkspaceIdAndOwnerUserId(root.getWorkspaceId(), ownerUserId);
    Map<UUID, List<FileEntryEntity>> childrenByParent = new HashMap<>();

    for (FileEntryEntity file : ownedFiles) {
      if (file.getParentId() == null) {
        continue;
      }
      childrenByParent.computeIfAbsent(file.getParentId(), ignored -> new ArrayList<>()).add(file);
    }

    List<FileEntryEntity> subtree = new ArrayList<>();
    Deque<FileEntryEntity> stack = new ArrayDeque<>();
    Set<UUID> visited = new HashSet<>();
    stack.push(root);

    while (!stack.isEmpty()) {
      FileEntryEntity current = stack.pop();
      if (!visited.add(current.getId())) {
        continue;
      }
      subtree.add(current);
      for (FileEntryEntity child : childrenByParent.getOrDefault(current.getId(), List.of())) {
        stack.push(child);
      }
    }

    return subtree;
  }

  private boolean canAccessFile(FileEntryEntity file, UUID userId) {
    if (Objects.equals(file.getOwnerUserId(), userId)) {
      return true;
    }
    return filePlanShareRepository.findByFileEntryId(file.getId()).stream()
        .filter(share -> share.getFileEntryId().equals(file.getId()))
        .anyMatch(share -> {
          try {
            planAccessService.requirePlanMember(share.getPlanId(), userId);
            return true;
          } catch (RuntimeException ex) {
            return false;
          }
        });
  }

  private String requireName(String name) {
    String normalized = name == null ? "" : name.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException("NOME_OBRIGATORIO", "O nome do arquivo ou pasta e obrigatorio.");
    }
    return normalized;
  }

  private FileItemView toView(FileEntryEntity file) {
    return toView(file, false, false);
  }

  private FileItemView toView(FileEntryEntity file, boolean sharedByCurrentUser, boolean canUnshare) {
    return new FileItemView(
        file.getId(),
        file.getParentId(),
        file.getName(),
        file.getType(),
        file.getMimeType(),
        file.getSizeBytes(),
        file.isStarred(),
        file.getDeletedAt() != null,
        sharedByCurrentUser,
        canUnshare,
        brazilDateTimeMapper.toDateTime(file.getCreatedAt()),
        brazilDateTimeMapper.toDateTime(file.getUpdatedAt())
    );
  }

  public record FileItemView(
      UUID id,
      UUID parentId,
      String name,
      FileEntryType type,
      String mimeType,
      Long sizeBytes,
      boolean starred,
      boolean deleted,
      boolean sharedByCurrentUser,
      boolean canUnshare,
      ApiDateTimeDto createdAt,
      ApiDateTimeDto updatedAt
  ) {
  }

  public record DownloadedFile(String name, String mimeType, byte[] content) {
  }

  public record MessageResponse(String message) {
  }

  private record SharedFile(FileEntryEntity file, boolean sharedByCurrentUser, boolean canUnshare) {
  }
}
