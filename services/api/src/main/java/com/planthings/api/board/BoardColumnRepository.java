package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardColumnRepository extends JpaRepository<BoardColumnEntity, UUID> {

  List<BoardColumnEntity> findByPlanIdOrderByPositionIndexAsc(UUID planId);
}
