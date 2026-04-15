package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardChecklistRepository extends JpaRepository<BoardChecklistEntity, UUID> {

  List<BoardChecklistEntity> findByCardIdOrderByPositionIndexAsc(UUID cardId);
}
