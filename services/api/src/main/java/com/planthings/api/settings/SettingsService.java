package com.planthings.api.settings;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserExternalIdentityRepository;
import com.planthings.api.auth.UserRepository;
import com.planthings.api.avatar.AvatarImageService;
import com.planthings.api.avatar.AvatarOwnerType;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.security.AuthenticatedUserService;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SettingsService {

  private static final Set<String> ALLOWED_DATE_FORMATS = Set.of(
      "dd/MM/yyyy",
      "MM/dd/yyyy",
      "yyyy-MM-dd"
  );
  private static final Set<String> ALLOWED_TIME_FORMATS = Set.of("24h", "12h");
  private static final Set<String> SUPPORTED_LOCALE_TAGS = Arrays.stream(Locale.getAvailableLocales())
      .map(Locale::toLanguageTag)
      .filter((tag) -> !tag.isBlank())
      .filter((tag) -> !"und".equalsIgnoreCase(tag))
      .collect(Collectors.toUnmodifiableSet());

  private final AuthenticatedUserService authenticatedUserService;
  private final UserRepository userRepository;
  private final UserSettingsRepository userSettingsRepository;
  private final GmailIntegrationService gmailIntegrationService;
  private final UserExternalIdentityRepository externalIdentityRepository;
  private final PasswordEncoder passwordEncoder;
  private final AvatarImageService avatarImageService;

  public SettingsService(
      AuthenticatedUserService authenticatedUserService,
      UserRepository userRepository,
      UserSettingsRepository userSettingsRepository,
      GmailIntegrationService gmailIntegrationService,
      UserExternalIdentityRepository externalIdentityRepository,
      PasswordEncoder passwordEncoder,
      AvatarImageService avatarImageService
  ) {
    this.authenticatedUserService = authenticatedUserService;
    this.userRepository = userRepository;
    this.userSettingsRepository = userSettingsRepository;
    this.gmailIntegrationService = gmailIntegrationService;
    this.externalIdentityRepository = externalIdentityRepository;
    this.passwordEncoder = passwordEncoder;
    this.avatarImageService = avatarImageService;
  }

  @Transactional(readOnly = true)
  public SettingsSnapshot getSettingsSnapshot() {
    UserEntity user = authenticatedUserService.requireUser();
    UserSettingsEntity userSettings = getOrCreateUserSettings(user.getId());

    return new SettingsSnapshot(
        accountSettingsFor(user),
        new PreferencesSettings(
            user.getLocaleTag(),
            user.getTimeZone(),
            userSettings.getTheme(),
            userSettings.getDateFormat(),
            userSettings.getTimeFormat()
        ),
        new NotificationSettings(
            userSettings.isEmailNotifs(),
            userSettings.isEventReminders(),
            userSettings.isDeadlineAlerts()
        ),
        gmailIntegrationService.getIntegrationsForUser(user.getId())
    );
  }

  @Transactional
  public AccountSettings updateAccount(String fullName) {
    UserEntity user = authenticatedUserService.requireUser();
    user.setFullName(requireFullName(fullName));
    userRepository.save(user);
    return accountSettingsFor(user);
  }

  @Transactional
  public AccountSettings uploadAccountAvatar(MultipartFile avatar) {
    UserEntity user = authenticatedUserService.requireUser();
    avatarImageService.upload(AvatarOwnerType.USER, user.getId(), avatar);
    return accountSettingsFor(user);
  }

  @Transactional
  public AccountSettings removeAccountAvatar() {
    UserEntity user = authenticatedUserService.requireUser();
    avatarImageService.remove(AvatarOwnerType.USER, user.getId());
    return accountSettingsFor(user);
  }

  @Transactional(readOnly = true)
  public AvatarImageService.AvatarDownload getAccountAvatar() {
    UserEntity user = authenticatedUserService.requireUser();
    return avatarImageService.download(AvatarOwnerType.USER, user.getId());
  }

  @Transactional
  public PreferencesSettings updatePreferences(
      String locale,
      String timeZone,
      String theme,
      String dateFormat,
      String timeFormat
  ) {
    UserEntity user = authenticatedUserService.requireUser();
    UserSettingsEntity userSettings = getOrCreateUserSettings(user.getId());

    user.setLocaleTag(requireLocale(locale));
    user.setTimeZone(requireTimeZone(timeZone));
    userSettings.setTheme(resolveTheme(theme, userSettings.getTheme()));
    userSettings.setDateFormat(requireDateFormat(dateFormat));
    userSettings.setTimeFormat(requireTimeFormat(timeFormat));

    userRepository.save(user);
    userSettingsRepository.save(userSettings);

    return new PreferencesSettings(
        user.getLocaleTag(),
        user.getTimeZone(),
        userSettings.getTheme(),
        userSettings.getDateFormat(),
        userSettings.getTimeFormat()
    );
  }

  @Transactional
  public NotificationSettings updateNotifications(
      boolean emailNotifs,
      boolean eventReminders,
      boolean deadlineAlerts
  ) {
    UserEntity user = authenticatedUserService.requireUser();
    UserSettingsEntity userSettings = getOrCreateUserSettings(user.getId());

    userSettings.setEmailNotifs(emailNotifs);
    userSettings.setEventReminders(eventReminders);
    userSettings.setDeadlineAlerts(deadlineAlerts);
    userSettingsRepository.save(userSettings);

    return new NotificationSettings(
        userSettings.isEmailNotifs(),
        userSettings.isEventReminders(),
        userSettings.isDeadlineAlerts()
    );
  }

  @Transactional
  public MessageResponse changePassword(String currentPassword, String newPassword) {
    UserEntity user = authenticatedUserService.requireUser();

    if (!user.isLocalPasswordEnabled() || user.getPasswordHash() == null) {
      throw new BadRequestException("SENHA_LOCAL_NAO_CONFIGURADA", "Crie uma senha local antes de usar a alteracao com senha atual.");
    }

    if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
      throw new BadRequestException("SENHA_ATUAL_INVALIDA", "A senha atual informada esta incorreta.");
    }

    validatePassword(newPassword);
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);

    return new MessageResponse("Senha atualizada com sucesso.");
  }

  @Transactional
  public MessageResponse setupOAuthPassword(String newPassword) {
    UserEntity user = authenticatedUserService.requireUser();

    if (!externalIdentityRepository.existsByUserId(user.getId())) {
      throw new BadRequestException(
          "CONTA_OAUTH_NAO_VINCULADA",
          "Esta acao esta disponivel apenas para contas vinculadas a OAuth."
      );
    }

    if (user.isLocalPasswordEnabled() && user.getPasswordHash() != null) {
      throw new BadRequestException(
          "SENHA_LOCAL_JA_CONFIGURADA",
          "Use a alteracao de senha com senha atual para substituir sua senha local."
      );
    }

    validatePassword(newPassword);
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    user.setLocalPasswordEnabled(true);
    userRepository.save(user);

    return new MessageResponse("Senha configurada com sucesso.");
  }

  private AccountSettings accountSettingsFor(UserEntity user) {
    return new AccountSettings(
        user.getFullName(),
        user.getEmail(),
        avatarImageService.avatarUrlFor(AvatarOwnerType.USER, user.getId()),
        user.isLocalPasswordEnabled(),
        externalIdentityRepository.existsByUserId(user.getId())
    );
  }

  private UserSettingsEntity getOrCreateUserSettings(java.util.UUID userId) {
    return userSettingsRepository.findByUserId(userId).orElseGet(() -> {
      UserSettingsEntity settings = new UserSettingsEntity();
      settings.setUserId(userId);
      return userSettingsRepository.save(settings);
    });
  }

  private String requireFullName(String value) {
    String normalized = normalizeRequired(value, "NOME_OBRIGATORIO", "O nome completo e obrigatorio.");
    if (normalized.length() > 120) {
      throw new BadRequestException("NOME_INVALIDO", "O nome completo deve ter no maximo 120 caracteres.");
    }
    return normalized;
  }

  private String requireLocale(String value) {
    String normalized = normalizeRequired(value, "IDIOMA_OBRIGATORIO", "O idioma e obrigatorio.");

    if (normalized.length() > 35) {
      throw new BadRequestException("IDIOMA_INVALIDO", "O idioma informado e invalido.");
    }

    String canonicalCandidate = normalized.replace('_', '-');

    try {
      Locale locale = Locale.forLanguageTag(canonicalCandidate);
      String canonical = locale.toLanguageTag();

      if (canonical.isBlank() || "und".equalsIgnoreCase(canonical) || locale.getLanguage().isBlank()) {
        throw new BadRequestException("IDIOMA_INVALIDO", "O idioma informado e invalido.");
      }
      if (!SUPPORTED_LOCALE_TAGS.contains(canonical)) {
        throw new BadRequestException("IDIOMA_INVALIDO", "O idioma informado e invalido.");
      }

      return canonical;
    } catch (RuntimeException exception) {
      throw new BadRequestException("IDIOMA_INVALIDO", "O idioma informado e invalido.");
    }
  }

  private String requireTimeZone(String value) {
    String normalized = normalizeRequired(value, "FUSO_OBRIGATORIO", "O fuso horario e obrigatorio.");

    if (normalized.length() > 80) {
      throw new BadRequestException("FUSO_INVALIDO", "O fuso horario informado e invalido.");
    }

    try {
      return ZoneId.of(normalized).getId();
    } catch (DateTimeException exception) {
      throw new BadRequestException("FUSO_INVALIDO", "O fuso horario informado e invalido.");
    }
  }

  private String requireDateFormat(String value) {
    String normalized = normalizeRequired(value, "FORMATO_DATA_OBRIGATORIO", "O formato de data e obrigatorio.");
    if (!ALLOWED_DATE_FORMATS.contains(normalized)) {
      throw new BadRequestException("FORMATO_DATA_INVALIDO", "O formato de data informado e invalido.");
    }
    return normalized;
  }

  private String requireTimeFormat(String value) {
    String normalized = normalizeRequired(value, "FORMATO_HORA_OBRIGATORIO", "O formato de hora e obrigatorio.");
    if (!ALLOWED_TIME_FORMATS.contains(normalized)) {
      throw new BadRequestException("FORMATO_HORA_INVALIDO", "O formato de hora informado e invalido.");
    }
    return normalized;
  }

  private String resolveTheme(String value, String fallback) {
    if (value == null) {
      return fallback == null || fallback.isBlank() ? "system" : fallback;
    }

    String normalized = value.trim().toLowerCase();
    if (normalized.isBlank()) {
      return fallback == null || fallback.isBlank() ? "system" : fallback;
    }

    return requireTheme(normalized);
  }

  private String requireTheme(String value) {
    if ("system".equals(value) || "light".equals(value) || "dark".equals(value)) {
      return value;
    }
    throw new BadRequestException("TEMA_INVALIDO", "O tema informado e invalido.");
  }

  private String normalizeRequired(String value, String code, String message) {
    String normalized = value == null ? "" : value.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException(code, message);
    }
    return normalized;
  }

  private void validatePassword(String password) {
    if (password == null || password.isBlank()) {
      throw new BadRequestException("SENHA_OBRIGATORIA", "A nova senha e obrigatoria.");
    }
    if (password.length() < 8) {
      throw new BadRequestException("SENHA_INVALIDA", "A senha deve ter pelo menos 8 caracteres.");
    }
  }

  public record SettingsSnapshot(
      AccountSettings account,
      PreferencesSettings preferences,
      NotificationSettings notifications,
      GmailIntegrationService.IntegrationsSettings integrations
  ) {
  }

  public record AccountSettings(
      String fullName,
      String email,
      String avatarUrl,
      boolean localPasswordEnabled,
      boolean externalIdentityLinked
  ) {
  }

  public record PreferencesSettings(
      String locale,
      String timeZone,
      String theme,
      String dateFormat,
      String timeFormat
  ) {
  }

  public record NotificationSettings(
      boolean emailNotifs,
      boolean eventReminders,
      boolean deadlineAlerts
  ) {
  }

  public record MessageResponse(String message) {
  }
}
