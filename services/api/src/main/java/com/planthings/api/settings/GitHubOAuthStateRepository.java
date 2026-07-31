package com.planthings.api.settings;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GitHubOAuthStateRepository extends JpaRepository<GitHubOAuthStateEntity, UUID> {

  @Query("select state from GitHubOAuthStateEntity state where state.stateToken = :stateToken")
  Optional<GitHubOAuthStateEntity> findByStateTokenForUpdate(@Param("stateToken") String stateToken);
}
