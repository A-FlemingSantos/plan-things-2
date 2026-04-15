package com.planthings.api.files;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileBlobRepository extends JpaRepository<FileBlobEntity, UUID> {

  Optional<FileBlobEntity> findByFileEntryId(UUID fileEntryId);
}
