package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardChecklistItemRepository extends JpaRepository<BoardChecklistItemEntity, UUID> {

  List<BoardChecklistItemEntity> findByChecklistIdOrderByPositionIndexAsc(UUID checklistId);

  @Modifying
  @Query("""
      update BoardChecklistItemEntity item
      set item.assigneeUserId = null
      where item.assigneeUserId = :userId
        and item.checklistId in (
          select checklist.id
          from BoardChecklistEntity checklist
          where checklist.cardId in (
            select card.id
            from BoardCardEntity card
            where card.planId = :planId
          )
        )
      """)
  int clearAssigneeForPlanUser(@Param("planId") UUID planId, @Param("userId") UUID userId);
}
