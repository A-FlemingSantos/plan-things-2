package com.planthings.api.common.time;

import com.planthings.api.common.api.ApiDateDto;
import com.planthings.api.common.api.ApiDateTimeDto;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

@Component
public class BrazilDateTimeMapper {

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
  private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

  private final ZoneId zoneId;

  public BrazilDateTimeMapper(ZoneId zoneId) {
    this.zoneId = zoneId;
  }

  public ApiDateDto toDate(LocalDate value) {
    if (value == null) {
      return null;
    }

    return new ApiDateDto(value.toString(), value.format(DATE_FORMATTER));
  }

  public ApiDateTimeDto toDateTime(OffsetDateTime value) {
    if (value == null) {
      return null;
    }

    OffsetDateTime localValue = value.atZoneSameInstant(zoneId).toOffsetDateTime();
    return new ApiDateTimeDto(value.toString(), localValue.format(DATE_TIME_FORMATTER));
  }
}
