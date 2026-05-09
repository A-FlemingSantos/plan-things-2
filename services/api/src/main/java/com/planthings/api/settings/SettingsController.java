package com.planthings.api.settings;

import com.planthings.api.common.api.ApiEnvelope;
import com.planthings.api.avatar.AvatarImageService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

  private final SettingsService settingsService;
  private final GmailIntegrationService gmailIntegrationService;
  private final SecuritySettingsService securitySettingsService;
  private final SettingsExportService settingsExportService;
  private final AccountDeletionService accountDeletionService;

  public SettingsController(
      SettingsService settingsService,
      GmailIntegrationService gmailIntegrationService,
      SecuritySettingsService securitySettingsService,
      SettingsExportService settingsExportService,
      AccountDeletionService accountDeletionService
  ) {
    this.settingsService = settingsService;
    this.gmailIntegrationService = gmailIntegrationService;
    this.securitySettingsService = securitySettingsService;
    this.settingsExportService = settingsExportService;
    this.accountDeletionService = accountDeletionService;
  }

  @GetMapping
  public ApiEnvelope<SettingsService.SettingsSnapshot> getSettingsSnapshot() {
    return ApiEnvelope.ok(settingsService.getSettingsSnapshot());
  }

  @PatchMapping("/account")
  public ApiEnvelope<SettingsService.AccountSettings> updateAccount(@Valid @RequestBody UpdateAccountRequest request) {
    return ApiEnvelope.ok(settingsService.updateAccount(request.fullName()));
  }

  @PostMapping(value = "/account/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiEnvelope<SettingsService.AccountSettings> uploadAccountAvatar(@RequestPart("file") MultipartFile file) {
    return ApiEnvelope.ok(settingsService.uploadAccountAvatar(file));
  }

  @DeleteMapping("/account/avatar")
  public ApiEnvelope<SettingsService.AccountSettings> removeAccountAvatar() {
    return ApiEnvelope.ok(settingsService.removeAccountAvatar());
  }

  @GetMapping("/account/avatar")
  public ResponseEntity<byte[]> getAccountAvatar() {
    AvatarImageService.AvatarDownload avatar = settingsService.getAccountAvatar();
    return ResponseEntity.ok()
        .header(HttpHeaders.CACHE_CONTROL, "private, max-age=300")
        .contentType(MediaType.parseMediaType(avatar.mimeType()))
        .body(avatar.content());
  }

  @PatchMapping("/preferences")
  public ApiEnvelope<SettingsService.PreferencesSettings> updatePreferences(@Valid @RequestBody UpdatePreferencesRequest request) {
    return ApiEnvelope.ok(settingsService.updatePreferences(
        request.locale(),
        request.timeZone(),
        request.theme(),
        request.dateFormat(),
        request.timeFormat()
    ));
  }

  @PatchMapping("/notifications")
  public ApiEnvelope<SettingsService.NotificationSettings> updateNotifications(@Valid @RequestBody UpdateNotificationsRequest request) {
    return ApiEnvelope.ok(settingsService.updateNotifications(
        request.emailNotifs(),
        request.eventReminders(),
        request.deadlineAlerts()
    ));
  }

  @PatchMapping("/password")
  public ApiEnvelope<SettingsService.MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
    return ApiEnvelope.ok(settingsService.changePassword(request.currentPassword(), request.newPassword()));
  }

  @PostMapping("/password/setup")
  public ApiEnvelope<SettingsService.MessageResponse> setupOAuthPassword(@Valid @RequestBody SetupPasswordRequest request) {
    return ApiEnvelope.ok(settingsService.setupOAuthPassword(request.newPassword()));
  }

  @GetMapping("/security/sessions")
  public ApiEnvelope<List<com.planthings.api.auth.UserSessionService.SessionSummary>> listActiveSessions() {
    return ApiEnvelope.ok(securitySettingsService.listSessions());
  }

  @DeleteMapping("/security/sessions/{sessionId}")
  public ApiEnvelope<SettingsService.MessageResponse> revokeSession(@org.springframework.web.bind.annotation.PathVariable UUID sessionId) {
    return ApiEnvelope.ok(securitySettingsService.revokeSession(sessionId));
  }

  @PostMapping("/security/sessions/revoke-others")
  public ApiEnvelope<SettingsService.MessageResponse> revokeOtherSessions() {
    return ApiEnvelope.ok(securitySettingsService.revokeOtherSessions());
  }

  @GetMapping("/export")
  public ResponseEntity<byte[]> exportSettingsData() {
    SettingsExportService.ExportBundle bundle = settingsExportService.exportCurrentUserData();
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + bundle.filename() + "\"")
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .body(bundle.content());
  }

  @PostMapping("/account/delete")
  public ApiEnvelope<SettingsService.MessageResponse> deleteAccount(@Valid @RequestBody DeleteAccountRequest request) {
    return ApiEnvelope.ok(accountDeletionService.deleteCurrentAccount(
        request.confirmEmail(),
        request.confirmPhrase(),
        request.currentPassword()
    ));
  }

  @PostMapping("/integrations/gmail/start")
  public ApiEnvelope<GmailIntegrationService.AuthorizationStartResponse> startGmailIntegration(
      @RequestBody(required = false) GmailStartRequest request
  ) {
    return ApiEnvelope.ok(gmailIntegrationService.startAuthorization(
        request == null ? null : request.client(),
        request == null ? null : request.redirectTo()
    ));
  }

  @GetMapping("/integrations/gmail/callback")
  public ResponseEntity<Void> gmailCallback(
      @RequestParam(required = false) String state,
      @RequestParam(required = false) String code,
      @RequestParam(required = false) String error
  ) {
    URI redirectUri = gmailIntegrationService.completeProviderCallback(state, code, error);
    return ResponseEntity.status(302).location(redirectUri).build();
  }

  @DeleteMapping("/integrations/gmail")
  public ApiEnvelope<GmailIntegrationService.IntegrationsSettings> disconnectGmailIntegration() {
    return ApiEnvelope.ok(gmailIntegrationService.disconnectGmail());
  }

  public record UpdateAccountRequest(
      @NotBlank(message = "O nome completo e obrigatorio.") String fullName
  ) {
  }

  public record UpdatePreferencesRequest(
      @NotBlank(message = "O idioma e obrigatorio.") String locale,
      @NotBlank(message = "O fuso horario e obrigatorio.") String timeZone,
      String theme,
      @NotBlank(message = "O formato de data e obrigatorio.") String dateFormat,
      @NotBlank(message = "O formato de hora e obrigatorio.") String timeFormat
  ) {
  }

  public record UpdateNotificationsRequest(
      boolean emailNotifs,
      boolean eventReminders,
      boolean deadlineAlerts
  ) {
  }

  public record ChangePasswordRequest(
      @NotBlank(message = "A senha atual e obrigatoria.") String currentPassword,
      @NotBlank(message = "A nova senha e obrigatoria.")
      @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres.") String newPassword
  ) {
  }

  public record SetupPasswordRequest(
      @NotBlank(message = "A nova senha e obrigatoria.")
      @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres.") String newPassword
  ) {
  }

  public record DeleteAccountRequest(
      @NotBlank(message = "Confirme o e-mail da conta.") String confirmEmail,
      @NotBlank(message = "Digite a frase de confirmacao.") String confirmPhrase,
      String currentPassword
  ) {
  }

  public record GmailStartRequest(String client, String redirectTo) {
  }
}
