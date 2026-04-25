package com.planthings.api.board;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardCardInboxDeliveryRecipientRepository extends JpaRepository<BoardCardInboxDeliveryRecipientEntity, UUID> {

  List<BoardCardInboxDeliveryRecipientEntity> findByDeliveryIdIn(Collection<UUID> deliveryIds);

  void deleteByDeliveryIdIn(Collection<UUID> deliveryIds);
}
