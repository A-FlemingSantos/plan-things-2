package com.planthings.api.board;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardCardInboxDeliveryRepository extends JpaRepository<BoardCardInboxDeliveryEntity, UUID> {

  List<BoardCardInboxDeliveryEntity> findTop50ByPlanIdOrderByCreatedAtDesc(UUID planId);
}
