package com.planthings.api.settings;

import com.planthings.api.auth.UserSessionService;
import com.planthings.api.common.security.AuthenticatedUserService;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SecuritySettingsService {

  private final AuthenticatedUserService authenticatedUserService;
  private final UserSessionService userSessionService;

  public SecuritySettingsService(
      AuthenticatedUserService authenticatedUserService,
      UserSessionService userSessionService
  ) {
    this.authenticatedUserService = authenticatedUserService;
    this.userSessionService = userSessionService;
  }

  @Transactional(readOnly = true)
  public List<UserSessionService.SessionSummary> listSessions() {
    return userSessionService.listActiveSessions(
        authenticatedUserService.requireUserId(),
        authenticatedUserService.requireSessionId()
    );
  }

  @Transactional
  public SettingsService.MessageResponse revokeSession(UUID sessionId) {
    userSessionService.revokeSession(
        authenticatedUserService.requireUserId(),
        authenticatedUserService.requireSessionId(),
        sessionId
    );
    return new SettingsService.MessageResponse("Sessao encerrada com sucesso.");
  }

  @Transactional
  public SettingsService.MessageResponse revokeOtherSessions() {
    userSessionService.revokeOtherSessions(
        authenticatedUserService.requireUserId(),
        authenticatedUserService.requireSessionId()
    );
    return new SettingsService.MessageResponse("As outras sessoes foram encerradas.");
  }
}
