package com.planthings.api.settings;

import com.planthings.api.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
public class UserSettingsEntity extends BaseEntity {

  @Column(nullable = false, unique = true)
  private UUID userId;

  @Column(nullable = false, length = 20)
  private String dateFormat = "dd/MM/yyyy";

  @Column(nullable = false, length = 10)
  private String timeFormat = "24h";

  @Column(nullable = false)
  private boolean emailNotifs = true;

  @Column(nullable = false)
  private boolean eventReminders = true;

  @Column(nullable = false)
  private boolean deadlineAlerts = true;

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public String getDateFormat() {
    return dateFormat;
  }

  public void setDateFormat(String dateFormat) {
    this.dateFormat = dateFormat;
  }

  public String getTimeFormat() {
    return timeFormat;
  }

  public void setTimeFormat(String timeFormat) {
    this.timeFormat = timeFormat;
  }

  public boolean isEmailNotifs() {
    return emailNotifs;
  }

  public void setEmailNotifs(boolean emailNotifs) {
    this.emailNotifs = emailNotifs;
  }

  public boolean isEventReminders() {
    return eventReminders;
  }

  public void setEventReminders(boolean eventReminders) {
    this.eventReminders = eventReminders;
  }

  public boolean isDeadlineAlerts() {
    return deadlineAlerts;
  }

  public void setDeadlineAlerts(boolean deadlineAlerts) {
    this.deadlineAlerts = deadlineAlerts;
  }
}
