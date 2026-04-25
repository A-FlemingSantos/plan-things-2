package com.planthings.api.settings;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GmailOAuthStateRepository extends JpaRepository<GmailOAuthStateEntity, UUID> {

  @Query("select state from GmailOAuthStateEntity state where state.stateToken = :stateToken")
  Optional<GmailOAuthStateEntity> findByStateTokenForUpdate(@Param("stateToken") String stateToken);
}
