package com.planthings.api.common.error;

import com.planthings.api.common.api.ApiEnvelope;
import com.planthings.api.common.api.ApiErrorResponse;
import com.planthings.api.common.api.ApiValidationError;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private final Clock clock;

  public GlobalExceptionHandler(Clock clock) {
    this.clock = clock;
  }

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiEnvelope<Void>> handleApiException(ApiException ex, HttpServletRequest request) {
    return buildResponse(
        ex.getStatus(),
        ex.getCode(),
        ex.getMessage(),
        request.getRequestURI(),
        List.of()
    );
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiEnvelope<Void>> handleValidation(
      MethodArgumentNotValidException ex,
      HttpServletRequest request
  ) {
    List<ApiValidationError> validations = ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .map(this::toValidationError)
        .toList();

    return buildResponse(
        HttpStatus.BAD_REQUEST,
        "VALIDACAO_INVALIDA",
        "Os dados enviados sao invalidos.",
        request.getRequestURI(),
        validations
    );
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiEnvelope<Void>> handleBadCredentials(
      BadCredentialsException ex,
      HttpServletRequest request
  ) {
    return buildResponse(
        HttpStatus.UNAUTHORIZED,
        "CREDENCIAIS_INVALIDAS",
        "E-mail ou senha invalidos.",
        request.getRequestURI(),
        List.of()
    );
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiEnvelope<Void>> handleAccessDenied(
      AccessDeniedException ex,
      HttpServletRequest request
  ) {
    return buildResponse(
        HttpStatus.FORBIDDEN,
        "ACESSO_NEGADO",
        "Voce nao tem permissao para executar esta acao.",
        request.getRequestURI(),
        List.of()
    );
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiEnvelope<Void>> handleUnexpected(
      Exception ex,
      HttpServletRequest request
  ) {
    return buildResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "ERRO_INTERNO",
        "Ocorreu um erro inesperado ao processar a solicitacao.",
        request.getRequestURI(),
        List.of()
    );
  }

  private ResponseEntity<ApiEnvelope<Void>> buildResponse(
      HttpStatus status,
      String code,
      String message,
      String path,
      List<ApiValidationError> validations
  ) {
    ApiErrorResponse error = new ApiErrorResponse(
        code,
        message,
        path,
        OffsetDateTime.now(clock),
        validations.isEmpty() ? null : validations
    );

    return ResponseEntity.status(status).body(ApiEnvelope.error(error));
  }

  private ApiValidationError toValidationError(FieldError error) {
    return new ApiValidationError(error.getField(), error.getDefaultMessage());
  }
}
