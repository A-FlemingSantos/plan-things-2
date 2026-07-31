package com.planthings.api.settings;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GitHubConnectionRepository extends JpaRepository<GitHubConnectionEntity, UUID> {

  Optional<GitHubConnectionEntity> findByUserId(UUID userId);
}
