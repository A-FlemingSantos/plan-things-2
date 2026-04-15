package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardCardCommentRepository extends JpaRepository<BoardCardCommentEntity, UUID> {

  List<BoardCardCommentEntity> findByCardIdOrderByCreatedAtAsc(UUID cardId);
}
