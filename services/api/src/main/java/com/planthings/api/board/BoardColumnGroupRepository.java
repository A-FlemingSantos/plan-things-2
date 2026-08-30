package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardColumnGroupRepository extends JpaRepository<BoardColumnGroupEntity, UUID> {

  List<BoardColumnGroupEntity> findByPlanId(UUID planId);

  List<BoardColumnGroupEntity> findByColumnId(UUID columnId);
}
