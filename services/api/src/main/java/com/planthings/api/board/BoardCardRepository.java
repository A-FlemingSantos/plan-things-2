package com.planthings.api.board;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardCardRepository extends JpaRepository<BoardCardEntity, UUID> {

  List<BoardCardEntity> findByPlanIdOrderByPositionIndexAsc(UUID planId);

  List<BoardCardEntity> findByColumnIdOrderByPositionIndexAsc(UUID columnId);

  Optional<BoardCardEntity> findByIdAndPlanId(UUID id, UUID planId);

  long countByPlanId(UUID planId);
}
