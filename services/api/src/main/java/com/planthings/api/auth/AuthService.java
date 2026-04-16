package com.planthings.api.auth;

import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ConflictException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.security.JwtService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.workspace.PersonalWorkspaceService;
import com.planthings.api.workspace.WorkspaceEntity;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final AuthenticatedUserService authenticatedUserService;
  private final PersonalWorkspaceService personalWorkspaceService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final Clock clock;
  private final long passwordResetMinutes;

  public AuthService(
      UserRepository userRepository,
      PasswordResetTokenRepository passwordResetTokenRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtService jwtService,
      AuthenticatedUserService authenticatedUserService,
      PersonalWorkspaceService personalWorkspaceService,
      BrazilDateTimeMapper brazilDateTimeMapper,
      Clock clock,
      @Value("${app.jwt.password-reset-minutes}") long passwordResetMinutes
  ) {
    this.userRepository = userRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.authenticatedUserService = authenticatedUserService;
    this.personalWorkspaceService = personalWorkspaceService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.clock = clock;
    this.passwordResetMinutes = passwordResetMinutes;
  }

  @Transactional
  public SessionResponse register(String fullName, String email, String password) {
    String normalizedName = normalizeName(fullName);
    String normalizedEmail = normalizeEmail(email);
    validatePassword(password);

    if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
      throw new ConflictException("EMAIL_EM_USO", "Ja existe uma conta cadastrada com este e-mail.");
    }

    UserEntity user = new UserEntity();
    user.setFullName(normalizedName);
    user.setEmail(normalizedEmail);
    user.setPasswordHash(passwordEncoder.encode(password));
    userRepository.save(user);

    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(user);

    return buildSessionResponse(user, workspace);
  }

  public SessionResponse login(String email, String password) {
    String normalizedEmail = normalizeEmail(email);
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(normalizedEmail, password)
    );

    UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos uma conta com este e-mail."));

    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(user);

    return buildSessionResponse(user, workspace);
  }

  @Transactional
  public ForgotPasswordResponse forgotPassword(String email) {
    String normalizedEmail = normalizeEmail(email);
    UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
        .orElseThrow(() -> new NotFoundException("EMAIL_NAO_ENCONTRADO", "Nao encontramos uma conta com este e-mail."));

    PasswordResetTokenEntity tokenEntity = new PasswordResetTokenEntity();
    tokenEntity.setUserId(user.getId());
    tokenEntity.setToken(UUID.randomUUID().toString());
    tokenEntity.setExpiresAt(OffsetDateTime.now(clock).plusMinutes(passwordResetMinutes));
    passwordResetTokenRepository.save(tokenEntity);

    return new ForgotPasswordResponse(
        "Token de redefinicao gerado com sucesso.",
        tokenEntity.getToken(),
        brazilDateTimeMapper.toDateTime(tokenEntity.getExpiresAt())
    );
  }

  @Transactional
  public MessageResponse resetPassword(String token, String newPassword) {
    validatePassword(newPassword);

    PasswordResetTokenEntity tokenEntity = passwordResetTokenRepository.findByToken(token)
        .orElseThrow(() -> new NotFoundException("TOKEN_NAO_ENCONTRADO", "O token de redefinicao informado nao existe."));

    if (tokenEntity.getUsedAt() != null) {
      throw new BadRequestException("TOKEN_JA_UTILIZADO", "Este token de redefinicao ja foi utilizado.");
    }

    OffsetDateTime now = OffsetDateTime.now(clock);
    if (tokenEntity.getExpiresAt().isBefore(now)) {
      throw new BadRequestException("TOKEN_EXPIRADO", "Este token de redefinicao expirou.");
    }

    UserEntity user = userRepository.findById(tokenEntity.getUserId())
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos o usuario vinculado a este token."));

    user.setPasswordHash(passwordEncoder.encode(newPassword));
    tokenEntity.setUsedAt(now);

    userRepository.save(user);
    passwordResetTokenRepository.save(tokenEntity);

    return new MessageResponse("Senha redefinida com sucesso.");
  }

  public CurrentUserResponse me() {
    UserEntity user = authenticatedUserService.requireUser();
    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(user);

    return new CurrentUserResponse(toUserSummary(user), toWorkspaceSummary(workspace));
  }

  private SessionResponse buildSessionResponse(UserEntity user, WorkspaceEntity workspace) {
    String token = jwtService.generateAccessToken(user.getId(), user.getEmail());
    return new SessionResponse(token, toUserSummary(user), toWorkspaceSummary(workspace));
  }

  private UserSummary toUserSummary(UserEntity user) {
    return new UserSummary(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        user.getLocaleTag(),
        user.getTimeZone(),
        brazilDateTimeMapper.toDateTime(user.getCreatedAt())
    );
  }

  private WorkspaceSummary toWorkspaceSummary(WorkspaceEntity workspace) {
    return new WorkspaceSummary(
        workspace.getId(),
        workspace.getName(),
        brazilDateTimeMapper.toDateTime(workspace.getCreatedAt())
    );
  }

  private String normalizeEmail(String email) {
    String normalized = email == null ? "" : email.trim().toLowerCase();
    if (normalized.isBlank()) {
      throw new BadRequestException("EMAIL_OBRIGATORIO", "O e-mail e obrigatorio.");
    }
    return normalized;
  }

  private String normalizeName(String fullName) {
    String normalized = fullName == null ? "" : fullName.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException("NOME_OBRIGATORIO", "O nome completo e obrigatorio.");
    }
    return normalized;
  }

  private void validatePassword(String password) {
    if (password == null || password.isBlank()) {
      throw new BadRequestException("SENHA_OBRIGATORIA", "A senha e obrigatoria.");
    }
    if (password.length() < 8) {
      throw new BadRequestException("SENHA_INVALIDA", "A senha deve ter pelo menos 8 caracteres.");
    }
  }

  public record SessionResponse(
      String accessToken,
      UserSummary user,
      WorkspaceSummary workspace
  ) {
  }

  public record CurrentUserResponse(
      UserSummary user,
      WorkspaceSummary workspace
  ) {
  }

  public record ForgotPasswordResponse(
      String message,
      String resetToken,
      ApiDateTimeDto expiresAt
  ) {
  }

  public record MessageResponse(String message) {
  }

  public record UserSummary(
      UUID id,
      String fullName,
      String email,
      String locale,
      String timeZone,
      ApiDateTimeDto createdAt
  ) {
  }

  public record WorkspaceSummary(
      UUID id,
      String name,
      ApiDateTimeDto createdAt
  ) {
  }
}
