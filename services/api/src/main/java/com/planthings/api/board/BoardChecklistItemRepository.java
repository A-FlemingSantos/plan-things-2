package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardChecklistItemRepository extends JpaRepository<BoardChecklistItemEntity, UUID> {

  List<BoardChecklistItemEntity> findByChecklistIdOrderByPositionIndexAsc(UUID checklistId);
}
