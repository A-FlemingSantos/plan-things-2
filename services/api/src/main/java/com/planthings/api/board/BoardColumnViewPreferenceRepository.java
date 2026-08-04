package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardColumnViewPreferenceRepository extends JpaRepository<BoardColumnViewPreferenceEntity, UUID> {

  List<BoardColumnViewPreferenceEntity> findByUserIdAndPlanId(UUID userId, UUID planId);

  @Modifying
  @Query("delete from BoardColumnViewPreferenceEntity preference where preference.userId = :userId and preference.planId = :planId")
  void deleteByUserIdAndPlanId(@Param("userId") UUID userId, @Param("planId") UUID planId);
}
