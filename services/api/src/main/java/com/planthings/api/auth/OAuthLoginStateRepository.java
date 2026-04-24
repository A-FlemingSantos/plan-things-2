package com.planthings.api.auth;

import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OAuthLoginStateRepository extends JpaRepository<OAuthLoginStateEntity, UUID> {

  Optional<OAuthLoginStateEntity> findByStateToken(String stateToken);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select state from OAuthLoginStateEntity state where state.stateToken = :stateToken")
  Optional<OAuthLoginStateEntity> findByStateTokenForUpdate(@Param("stateToken") String stateToken);
}
