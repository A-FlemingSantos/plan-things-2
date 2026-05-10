package com.planthings.api.avatar;

import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.NotFoundException;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AvatarImageService {

  private static final long MAX_AVATAR_BYTES = 2L * 1024L * 1024L;
  private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/png", "image/jpeg", "image/webp");

  private final AvatarImageRepository avatarImageRepository;

  public AvatarImageService(AvatarImageRepository avatarImageRepository) {
    this.avatarImageRepository = avatarImageRepository;
  }

  @Transactional
  public String upload(AvatarOwnerType ownerType, UUID ownerId, MultipartFile file) {
    AvatarPayload payload = validate(file);
    AvatarImageEntity avatar = avatarImageRepository
        .findByOwnerTypeAndOwnerId(ownerType, ownerId)
        .orElseGet(AvatarImageEntity::new);

    avatar.setOwnerType(ownerType);
    avatar.setOwnerId(ownerId);
    avatar.setMimeType(payload.mimeType());
    avatar.setContent(payload.content());
    AvatarImageEntity saved = avatarImageRepository.save(avatar);
    return urlFor(saved);
  }

  @Transactional
  public void remove(AvatarOwnerType ownerType, UUID ownerId) {
    avatarImageRepository.deleteByOwnerTypeAndOwnerId(ownerType, ownerId);
  }

  @Transactional(readOnly = true)
  public AvatarDownload download(AvatarOwnerType ownerType, UUID ownerId) {
    AvatarImageEntity avatar = avatarImageRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
        .orElseThrow(() -> new NotFoundException("AVATAR_NAO_ENCONTRADO", "Nao encontramos o avatar solicitado."));
    return new AvatarDownload(avatar.getMimeType(), avatar.getContent());
  }

  @Transactional(readOnly = true)
  public String avatarUrlFor(AvatarOwnerType ownerType, UUID ownerId) {
    return avatarImageRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
        .map(this::urlFor)
        .orElse(null);
  }

  private AvatarPayload validate(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("AVATAR_VAZIO", "Selecione uma imagem valida para o avatar.");
    }
    if (file.getSize() > MAX_AVATAR_BYTES) {
      throw new BadRequestException("AVATAR_MUITO_GRANDE", "O avatar deve ter no maximo 2 MB.");
    }

    String declaredMimeType = normalizeMimeType(file.getContentType());
    if (!ALLOWED_MIME_TYPES.contains(declaredMimeType)) {
      throw new BadRequestException("AVATAR_TIPO_INVALIDO", "Use uma imagem PNG, JPG ou WebP.");
    }

    byte[] content;
    try {
      content = file.getBytes();
    } catch (IOException exception) {
      throw new BadRequestException("AVATAR_INVALIDO", "Nao foi possivel ler a imagem enviada.");
    }

    String detectedMimeType = detectMimeType(content);
    if (!declaredMimeType.equals(detectedMimeType)) {
      throw new BadRequestException("AVATAR_TIPO_INVALIDO", "Use uma imagem PNG, JPG ou WebP.");
    }

    return new AvatarPayload(declaredMimeType, content);
  }

  private String detectMimeType(byte[] content) {
    if (content.length >= 8
        && (content[0] & 0xff) == 0x89
        && content[1] == 0x50
        && content[2] == 0x4e
        && content[3] == 0x47
        && content[4] == 0x0d
        && content[5] == 0x0a
        && content[6] == 0x1a
        && content[7] == 0x0a) {
      return "image/png";
    }

    if (content.length >= 3
        && (content[0] & 0xff) == 0xff
        && (content[1] & 0xff) == 0xd8
        && (content[2] & 0xff) == 0xff) {
      return "image/jpeg";
    }

    if (content.length >= 12
        && content[0] == 0x52
        && content[1] == 0x49
        && content[2] == 0x46
        && content[3] == 0x46
        && content[8] == 0x57
        && content[9] == 0x45
        && content[10] == 0x42
        && content[11] == 0x50) {
      return "image/webp";
    }

    return "";
  }

  private String normalizeMimeType(String value) {
    return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
  }

  private String urlFor(AvatarImageEntity avatar) {
    String basePath = "/api/avatars/users/" + avatar.getOwnerId();
    long version = avatar.getUpdatedAt() == null ? 0L : avatar.getUpdatedAt().toInstant().toEpochMilli();
    return basePath + "?v=" + version;
  }

  private record AvatarPayload(String mimeType, byte[] content) {
  }

  public record AvatarDownload(String mimeType, byte[] content) {
  }
}
