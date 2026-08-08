package com.planthings.api.auth;

import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.error.UnauthorizedException;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserSessionService {

  private static final Duration LAST_SEEN_REFRESH_INTERVAL = Duration.ofMinutes(5);

  private final UserSessionRepository userSessionRepository;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final Clock clock;

  public UserSessionService(
      UserSessionRepository userSessionRepository,
      BrazilDateTimeMapper brazilDateTimeMapper,
      Clock clock
  ) {
    this.userSessionRepository = userSessionRepository;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.clock = clock;
  }

  @Transactional
  public UserSessionEntity createSession(UUID userId, String client, String userAgent) {
    OffsetDateTime now = OffsetDateTime.now(clock);

    UserSessionEntity session = new UserSessionEntity();
    session.setUserId(userId);
    session.setClient(normalizeClient(client));
    session.setUserAgent(normalizeUserAgent(userAgent));
    session.setDeviceLabel(resolveDeviceLabel(session.getClient(), session.getUserAgent()));
    session.setLastSeenAt(now);
    return userSessionRepository.save(session);
  }

  @Transactional(readOnly = true)
  public UserSessionEntity requireActiveSession(UUID userId, UUID sessionId) {
    UserSessionEntity session = userSessionRepository.findByIdAndUserId(sessionId, userId)
        .orElseThrow(() -> new UnauthorizedException("SESSAO_INVALIDA", "Sua sessao nao e mais valida."));

    if (session.getRevokedAt() != null) {
      throw new UnauthorizedException("SESSAO_REVOGADA", "Sua sessao foi encerrada. Faca login novamente.");
    }

    return session;
  }

  @Transactional
  public void touchSession(UserSessionEntity session) {
    OffsetDateTime now = OffsetDateTime.now(clock);
    OffsetDateTime lastSeenAt = session.getLastSeenAt();

    if (lastSeenAt != null && lastSeenAt.plus(LAST_SEEN_REFRESH_INTERVAL).isAfter(now)) {
      return;
    }

    session.setLastSeenAt(now);
    userSessionRepository.save(session);
  }

  @Transactional(readOnly = true)
  public List<SessionSummary> listActiveSessions(UUID userId, UUID currentSessionId) {
    return userSessionRepository.findByUserIdAndRevokedAtIsNullOrderByLastSeenAtDescCreatedAtDesc(userId).stream()
        .map(session -> toSummary(session, currentSessionId))
        .toList();
  }

  @Transactional
  public void revokeSession(UUID userId, UUID currentSessionId, UUID sessionId) {
    if (sessionId.equals(currentSessionId)) {
      throw new BadRequestException("SESSAO_ATUAL_NAO_REVOGAVEL", "Use sair para encerrar a sessao atual.");
    }

    int updated = userSessionRepository.revokeOne(userId, sessionId, OffsetDateTime.now(clock));
    if (updated == 0) {
      throw new NotFoundException("SESSAO_NAO_ENCONTRADA", "Nao encontramos a sessao informada.");
    }
  }

  @Transactional
  public void revokeCurrentSession(UUID userId, UUID sessionId) {
    userSessionRepository.revokeOne(userId, sessionId, OffsetDateTime.now(clock));
  }

  @Transactional
  public void revokeOtherSessions(UUID userId, UUID currentSessionId) {
    userSessionRepository.revokeAllExcept(userId, currentSessionId, OffsetDateTime.now(clock));
  }

  @Transactional
  public void revokeAllSessions(UUID userId) {
    userSessionRepository.revokeAllExcept(userId, null, OffsetDateTime.now(clock));
  }

  public String normalizeClient(String client) {
    String normalized = client == null ? "" : client.trim().toLowerCase(Locale.ROOT);
    return "mobile".equals(normalized) ? "mobile" : "web";
  }

  private SessionSummary toSummary(UserSessionEntity session, UUID currentSessionId) {
    boolean current = session.getId().equals(currentSessionId);
    return new SessionSummary(
        session.getId(),
        session.getClient(),
        session.getDeviceLabel(),
        brazilDateTimeMapper.toDateTime(session.getCreatedAt()),
        brazilDateTimeMapper.toDateTime(session.getLastSeenAt()),
        current,
        !current
    );
  }

  private String normalizeUserAgent(String userAgent) {
    if (userAgent == null || userAgent.isBlank()) {
      return null;
    }

    String trimmed = userAgent.trim();
    return trimmed.length() > 1000 ? trimmed.substring(0, 1000) : trimmed;
  }

  private String resolveDeviceLabel(String client, String userAgent) {
    if ("mobile".equals(client)) {
      return "App mobile" + describePlatform(userAgent);
    }

    return "Navegador web" + describePlatform(userAgent) + describeBrowser(userAgent);
  }

  private String describePlatform(String userAgent) {
    if (userAgent == null || userAgent.isBlank()) {
      return "";
    }

    String normalized = userAgent.toLowerCase(Locale.ROOT);
    if (normalized.contains("android")) return " · Android";
    if (normalized.contains("iphone") || normalized.contains("ipad") || normalized.contains("ios")) return " · iOS";
    if (normalized.contains("windows")) return " · Windows";
    if (normalized.contains("mac os") || normalized.contains("macintosh")) return " · macOS";
    if (normalized.contains("linux")) return " · Linux";
    return "";
  }

  private String describeBrowser(String userAgent) {
    if (userAgent == null || userAgent.isBlank()) {
      return "";
    }

    String normalized = userAgent.toLowerCase(Locale.ROOT);
    if (normalized.contains("edg/")) return " · Edge";
    if (normalized.contains("firefox/")) return " · Firefox";
    if (normalized.contains("chrome/")) return " · Chrome";
    if (normalized.contains("safari/") && !normalized.contains("chrome/")) return " · Safari";
    return "";
  }

  public record SessionSummary(
      UUID id,
      String client,
      String deviceLabel,
      ApiDateTimeDto createdAt,
      ApiDateTimeDto lastSeenAt,
      boolean current,
      boolean revocable
  ) {
  }
}
