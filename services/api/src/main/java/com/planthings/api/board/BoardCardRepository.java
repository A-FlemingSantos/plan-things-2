package com.planthings.api.board;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

public interface BoardCardRepository extends JpaRepository<BoardCardEntity, UUID> {

  List<BoardCardEntity> findByPlanIdOrderByPositionIndexAsc(UUID planId);

  List<BoardCardEntity> findByColumnIdOrderByPositionIndexAsc(UUID columnId);

  Optional<BoardCardEntity> findByIdAndPlanId(UUID id, UUID planId);

  long countByPlanId(UUID planId);

  @Query("""
      select card
      from BoardCardEntity card
      where card.planId = :planId
        and (
          :query = ''
          or lower(card.title) like lower(concat('%', :query, '%'))
          or lower(coalesce(card.description, '')) like lower(concat('%', :query, '%'))
        )
      order by card.updatedAt desc
      """)
  List<BoardCardEntity> searchByPlanId(
      @Param("planId") UUID planId,
      @Param("query") String query,
      Pageable pageable
  );
}
