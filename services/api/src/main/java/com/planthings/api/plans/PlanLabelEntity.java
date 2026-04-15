package com.planthings.api.plans;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "plan_labels")
public class PlanLabelEntity extends BaseEntity {

  @Column(nullable = false)
  private UUID planId;

  @Column(nullable = false, length = 80)
  private String name;

  @Column(nullable = false, length = 20)
  private String color;

  public UUID getPlanId() {
    return planId;
  }

  public void setPlanId(UUID planId) {
    this.planId = planId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getColor() {
    return color;
  }

  public void setColor(String color) {
    this.color = color;
  }
}
