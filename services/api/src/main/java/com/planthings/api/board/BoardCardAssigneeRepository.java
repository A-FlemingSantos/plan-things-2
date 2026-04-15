package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardCardAssigneeRepository extends JpaRepository<BoardCardAssigneeEntity, UUID> {

  List<BoardCardAssigneeEntity> findByCardId(UUID cardId);

  void deleteByCardId(UUID cardId);
}
