package com.planthings.api.auth;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/auth/register")
  public ApiEnvelope<AuthService.SessionResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ApiEnvelope.ok(authService.register(request.fullName(), request.email(), request.password()));
  }

  @PostMapping("/auth/login")
  public ApiEnvelope<AuthService.SessionResponse> login(@Valid @RequestBody LoginRequest request) {
    return ApiEnvelope.ok(authService.login(request.email(), request.password()));
  }

  @PostMapping("/auth/forgot-password")
  public ApiEnvelope<AuthService.ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    return ApiEnvelope.ok(authService.forgotPassword(request.email()));
  }

  @PostMapping("/auth/reset-password")
  public ApiEnvelope<AuthService.MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    return ApiEnvelope.ok(authService.resetPassword(request.token(), request.newPassword()));
  }

  @GetMapping("/me")
  public ApiEnvelope<AuthService.CurrentUserResponse> me() {
    return ApiEnvelope.ok(authService.me());
  }

  public record RegisterRequest(
      @NotBlank(message = "O nome completo e obrigatorio.") String fullName,
      @NotBlank(message = "O e-mail e obrigatorio.")
      @Email(message = "Informe um e-mail valido.") String email,
      @NotBlank(message = "A senha e obrigatoria.")
      @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres.") String password
  ) {
  }

  public record LoginRequest(
      @NotBlank(message = "O e-mail e obrigatorio.")
      @Email(message = "Informe um e-mail valido.") String email,
      @NotBlank(message = "A senha e obrigatoria.") String password
  ) {
  }

  public record ForgotPasswordRequest(
      @NotBlank(message = "O e-mail e obrigatorio.")
      @Email(message = "Informe um e-mail valido.") String email
  ) {
  }

  public record ResetPasswordRequest(
      @NotBlank(message = "O token e obrigatorio.") String token,
      @NotBlank(message = "A nova senha e obrigatoria.")
      @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres.") String newPassword
  ) {
  }
}
