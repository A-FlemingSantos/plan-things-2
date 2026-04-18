package com.planthings.api.settings;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

  private final SettingsService settingsService;

  public SettingsController(SettingsService settingsService) {
    this.settingsService = settingsService;
  }

  @GetMapping
  public ApiEnvelope<SettingsService.SettingsSnapshot> getSettingsSnapshot() {
    return ApiEnvelope.ok(settingsService.getSettingsSnapshot());
  }

  @PatchMapping("/account")
  public ApiEnvelope<SettingsService.AccountSettings> updateAccount(@Valid @RequestBody UpdateAccountRequest request) {
    return ApiEnvelope.ok(settingsService.updateAccount(request.fullName()));
  }

  @PatchMapping("/preferences")
  public ApiEnvelope<SettingsService.PreferencesSettings> updatePreferences(@Valid @RequestBody UpdatePreferencesRequest request) {
    return ApiEnvelope.ok(settingsService.updatePreferences(
        request.locale(),
        request.timeZone(),
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

  public record UpdateAccountRequest(
      @NotBlank(message = "O nome completo e obrigatorio.") String fullName
  ) {
  }

  public record UpdatePreferencesRequest(
      @NotBlank(message = "O idioma e obrigatorio.") String locale,
      @NotBlank(message = "O fuso horario e obrigatorio.") String timeZone,
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
}
