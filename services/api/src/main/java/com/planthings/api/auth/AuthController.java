package com.planthings.api.auth;

import com.planthings.api.common.api.ApiEnvelope;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import java.net.URI;

@Validated
@RestController
@RequestMapping("/api")
public class AuthController {

  private final AuthService authService;
  private final OAuthLoginService oauthLoginService;

  public AuthController(AuthService authService, OAuthLoginService oauthLoginService) {
    this.authService = authService;
    this.oauthLoginService = oauthLoginService;
  }

  @PostMapping("/auth/register")
  public ApiEnvelope<AuthService.SessionResponse> register(
      @Valid @RequestBody RegisterRequest request,
      HttpServletRequest httpRequest
  ) {
    return ApiEnvelope.ok(authService.register(
        request.fullName(),
        request.email(),
        request.password(),
        request.client(),
        httpRequest.getHeader("User-Agent")
    ));
  }

  @PostMapping("/auth/login")
  public ApiEnvelope<AuthService.SessionResponse> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest httpRequest
  ) {
    return ApiEnvelope.ok(authService.login(
        request.email(),
        request.password(),
        request.client(),
        httpRequest.getHeader("User-Agent")
    ));
  }

  @PostMapping("/auth/forgot-password")
  public ApiEnvelope<AuthService.ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    return ApiEnvelope.ok(authService.forgotPassword(request.email()));
  }

  @PostMapping("/auth/reset-password")
  public ApiEnvelope<AuthService.MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    return ApiEnvelope.ok(authService.resetPassword(request.token(), request.newPassword()));
  }

  @PostMapping("/auth/oauth/{provider}/start")
  public ApiEnvelope<OAuthLoginService.AuthorizationStartResponse> startOAuth(
      @PathVariable String provider,
      @RequestBody(required = false) OAuthStartRequest request
  ) {
    return ApiEnvelope.ok(oauthLoginService.start(
        provider,
        request == null ? null : request.redirectTo(),
        request == null ? null : request.client()
    ));
  }

  @GetMapping("/auth/oauth/{provider}/callback")
  public ResponseEntity<Void> oauthCallback(
      @PathVariable String provider,
      @RequestParam(required = false) String state,
      @RequestParam(required = false) String code,
      @RequestParam(required = false) String error
  ) {
    URI redirectUri = oauthLoginService.completeProviderCallback(provider, state, code, error);
    return ResponseEntity.status(302).location(redirectUri).build();
  }

  @PostMapping("/auth/oauth/exchange")
  public ApiEnvelope<AuthService.SessionResponse> exchangeOAuthCode(
      @Valid @RequestBody OAuthExchangeRequest request,
      HttpServletRequest httpRequest
  ) {
    return ApiEnvelope.ok(oauthLoginService.exchangeCompletionCode(request.code(), httpRequest.getHeader("User-Agent")));
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
      @Size(min = 8, message = "A senha deve ter pelo menos 8 caracteres.") String password,
      String client
  ) {
  }

  public record LoginRequest(
      @NotBlank(message = "O e-mail e obrigatorio.")
      @Email(message = "Informe um e-mail valido.") String email,
      @NotBlank(message = "A senha e obrigatoria.") String password,
      String client
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

  public record OAuthStartRequest(String redirectTo, String client) {
  }

  public record OAuthExchangeRequest(
      @NotBlank(message = "O codigo de conclusao e obrigatorio.") String code
  ) {
  }
}
