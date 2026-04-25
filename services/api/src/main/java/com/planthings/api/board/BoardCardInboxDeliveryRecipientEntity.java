package com.planthings.api.board;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "board_card_inbox_delivery_recipients")
public class BoardCardInboxDeliveryRecipientEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID deliveryId;

  @Column(nullable = false)
  private UUID userId;

  @Column(nullable = false, length = 160)
  private String email;

  public UUID getDeliveryId() {
    return deliveryId;
  }

  public void setDeliveryId(UUID deliveryId) {
    this.deliveryId = deliveryId;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }
}
