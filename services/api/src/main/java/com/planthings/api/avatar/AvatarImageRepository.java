package com.planthings.api.avatar;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AvatarImageRepository extends JpaRepository<AvatarImageEntity, UUID> {
  Optional<AvatarImageEntity> findByOwnerTypeAndOwnerId(AvatarOwnerType ownerType, UUID ownerId);

  boolean existsByOwnerTypeAndOwnerId(AvatarOwnerType ownerType, UUID ownerId);

  void deleteByOwnerTypeAndOwnerId(AvatarOwnerType ownerType, UUID ownerId);
}

