package com.planthings.api.calendar;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
