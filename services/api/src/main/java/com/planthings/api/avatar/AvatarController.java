package com.planthings.api.avatar;

import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/avatars")
public class AvatarController {

  private final AvatarImageService avatarImageService;

  public AvatarController(AvatarImageService avatarImageService) {
    this.avatarImageService = avatarImageService;
  }

  @GetMapping("/users/{userId}")
  public ResponseEntity<byte[]> getUserAvatar(@PathVariable UUID userId) {
    AvatarImageService.AvatarDownload avatar = avatarImageService.download(AvatarOwnerType.USER, userId);
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .contentType(MediaType.parseMediaType(avatar.mimeType()))
        .body(avatar.content());
  }
}
