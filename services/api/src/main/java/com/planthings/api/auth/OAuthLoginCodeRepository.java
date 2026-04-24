package com.planthings.api.auth;

import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OAuthLoginCodeRepository extends JpaRepository<OAuthLoginCodeEntity, UUID> {

  Optional<OAuthLoginCodeEntity> findByCompletionCode(String completionCode);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select code from OAuthLoginCodeEntity code where code.completionCode = :completionCode")
  Optional<OAuthLoginCodeEntity> findByCompletionCodeForUpdate(@Param("completionCode") String completionCode);
}
