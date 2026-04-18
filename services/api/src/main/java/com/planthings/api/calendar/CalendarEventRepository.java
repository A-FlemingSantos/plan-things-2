package com.planthings.api.calendar;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CalendarEventRepository extends JpaRepository<CalendarEventEntity, UUID> {

  List<CalendarEventEntity> findByWorkspaceIdOrderByStartsAtAsc(UUID workspaceId);

  List<CalendarEventEntity> findByWorkspaceIdAndStartsAtBetweenOrderByStartsAtAsc(
      UUID workspaceId,
      OffsetDateTime start,
      OffsetDateTime end
  );

  List<CalendarEventEntity> findByPlanIdInOrderByStartsAtAsc(List<UUID> planIds);

  List<CalendarEventEntity> findByPlanIdInAndStartsAtBetweenOrderByStartsAtAsc(
      List<UUID> planIds,
      OffsetDateTime start,
      OffsetDateTime end
  );

  Optional<CalendarEventEntity> findByLinkedCardId(UUID linkedCardId);

  @Modifying
  @Query("""
      delete from CalendarEventEntity e
      where e.planId = :planId
         or e.linkedCardId in (select c.id from BoardCardEntity c where c.planId = :planId)
      """)
  int deleteForPlan(@Param("planId") UUID planId);
}
