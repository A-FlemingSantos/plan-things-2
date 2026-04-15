package com.planthings.api.files;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FilePlanShareRepository extends JpaRepository<FilePlanShareEntity, UUID> {

  List<FilePlanShareEntity> findByPlanId(UUID planId);

  Optional<FilePlanShareEntity> findByPlanIdAndFileEntryId(UUID planId, UUID fileEntryId);
}
