package com.planthings.api.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfiguration {

  @Bean
  public Clock utcClock() {
    return Clock.systemUTC();
  }

  @Bean
  public ZoneId applicationZoneId(@Value("${app.time.zone-id}") String zoneId) {
    return ZoneId.of(zoneId);
  }
}
