package com.planthings.api.settings;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GmailConnectionStatusService {

  private final GmailConnectionRepository connectionRepository;
  private final Clock clock;

  public GmailConnectionStatusService(GmailConnectionRepository connectionRepository, Clock clock) {
    this.connectionRepository = connectionRepository;
    this.clock = clock;
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void rememberLastError(UUID connectionId, String errorCode) {
    connectionRepository.findById(connectionId).ifPresent(connection -> {
      connection.setLastError(errorCode);
      connection.setLastCheckedAt(OffsetDateTime.now(clock));
      connectionRepository.save(connection);
    });
  }
}
