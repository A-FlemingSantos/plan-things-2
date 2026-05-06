package com.planthings.api.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserExternalIdentityRepository extends JpaRepository<UserExternalIdentityEntity, UUID> {

  Optional<UserExternalIdentityEntity> findByProviderAndProviderSubject(String provider, String providerSubject);

  Optional<UserExternalIdentityEntity> findByUserIdAndProvider(UUID userId, String provider);

  boolean existsByUserId(UUID userId);
}
