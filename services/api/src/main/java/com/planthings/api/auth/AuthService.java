package com.planthings.api.auth;

import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.error.ConflictException;
import com.planthings.api.common.error.NotFoundException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.security.JwtService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.avatar.AvatarImageService;
import com.planthings.api.avatar.AvatarOwnerType;
import com.planthings.api.workspace.PersonalWorkspaceService;
import com.planthings.api.workspace.WorkspaceEntity;
import com.planthings.api.workspace.WorkspaceStorageService;
import com.planthings.api.workspace.WorkspaceSubscriptionPlan;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.Locale;
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
  private final UserExternalIdentityRepository externalIdentityRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final AuthenticatedUserService authenticatedUserService;
  private final PersonalWorkspaceService personalWorkspaceService;
  private final WorkspaceStorageService workspaceStorageService;
  private final BrazilDateTimeMapper brazilDateTimeMapper;
  private final AvatarImageService avatarImageService;
  private final Clock clock;
  private final long passwordResetMinutes;

  public AuthService(
      UserRepository userRepository,
      UserExternalIdentityRepository externalIdentityRepository,
      PasswordResetTokenRepository passwordResetTokenRepository,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtService jwtService,
      AuthenticatedUserService authenticatedUserService,
      PersonalWorkspaceService personalWorkspaceService,
      WorkspaceStorageService workspaceStorageService,
      BrazilDateTimeMapper brazilDateTimeMapper,
      AvatarImageService avatarImageService,
      Clock clock,
      @Value("${app.jwt.password-reset-minutes}") long passwordResetMinutes
  ) {
    this.userRepository = userRepository;
    this.externalIdentityRepository = externalIdentityRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.authenticatedUserService = authenticatedUserService;
    this.personalWorkspaceService = personalWorkspaceService;
    this.workspaceStorageService = workspaceStorageService;
    this.brazilDateTimeMapper = brazilDateTimeMapper;
    this.avatarImageService = avatarImageService;
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
    user.setLocalPasswordEnabled(true);
    userRepository.save(user);

    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(user);

    return buildSessionResponse(user, workspace);
  }

  public SessionResponse login(String email, String password) {
    String normalizedEmail = normalizeEmail(email);
    UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos uma conta com este e-mail."));

    if (!user.isLocalPasswordEnabled() || user.getPasswordHash() == null) {
      throw new BadRequestException(
          "SENHA_LOCAL_NAO_CONFIGURADA",
          "Esta conta ainda nao tem senha local. Entre com OAuth e crie uma senha nas configuracoes."
      );
    }

    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(normalizedEmail, password)
    );

    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(user);

    return buildSessionResponse(user, workspace);
  }

  @Transactional
  public SessionResponse loginWithExternalIdentity(OAuthIdentity identity) {
    String provider = normalizeProvider(identity.provider());
    String providerSubject = normalizeExternalSubject(identity.providerSubject());
    String normalizedEmail = normalizeEmail(identity.email());

    if (!identity.emailVerified()) {
      throw new BadRequestException("EMAIL_OAUTH_NAO_VERIFICADO", "O provedor externo nao confirmou este e-mail.");
    }

    return externalIdentityRepository.findByProviderAndProviderSubject(provider, providerSubject)
        .map(externalIdentity -> loginExistingExternalIdentity(externalIdentity, identity, normalizedEmail))
        .orElseGet(() -> loginAndLinkExternalIdentity(provider, providerSubject, identity, normalizedEmail));
  }

  public SessionResponse sessionForUserId(UUID userId) {
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos o usuario vinculado a este login."));
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
    user.setLocalPasswordEnabled(true);
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
        avatarImageService.avatarUrlFor(AvatarOwnerType.USER, user.getId()),
        user.getLocaleTag(),
        user.getTimeZone(),
        brazilDateTimeMapper.toDateTime(user.getCreatedAt()),
        user.isLocalPasswordEnabled(),
        externalIdentityRepository.existsByUserId(user.getId())
    );
  }

  private WorkspaceSummary toWorkspaceSummary(WorkspaceEntity workspace) {
    WorkspaceStorageService.StorageSnapshot storage = workspaceStorageService.snapshot(workspace);
    return new WorkspaceSummary(
        workspace.getId(),
        workspace.getName(),
        avatarImageService.avatarUrlFor(AvatarOwnerType.WORKSPACE, workspace.getId()),
        workspace.getSubscriptionPlan(),
        storage.storageUsedBytes(),
        storage.storageQuotaBytes(),
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

  private SessionResponse loginExistingExternalIdentity(
      UserExternalIdentityEntity externalIdentity,
      OAuthIdentity identity,
      String normalizedEmail
  ) {
    UserEntity user = userRepository.findById(externalIdentity.getUserId())
        .orElseThrow(() -> new NotFoundException("USUARIO_NAO_ENCONTRADO", "Nao encontramos o usuario vinculado a este login."));

    updateExternalIdentitySnapshot(externalIdentity, identity, normalizedEmail);
    externalIdentityRepository.save(externalIdentity);

    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(user);
    return buildSessionResponse(user, workspace);
  }

  private SessionResponse loginAndLinkExternalIdentity(
      String provider,
      String providerSubject,
      OAuthIdentity identity,
      String normalizedEmail
  ) {
    UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
        .map(existingUser -> requireTrustedAutoLink(existingUser, identity))
        .orElseGet(() -> createExternalUser(identity, normalizedEmail));

    externalIdentityRepository.findByUserIdAndProvider(user.getId(), provider)
        .ifPresent(existing -> {
          throw new ConflictException(
              "PROVEDOR_OAUTH_JA_VINCULADO",
              "Esta conta ja esta vinculada a outro login deste provedor."
          );
        });

    UserExternalIdentityEntity externalIdentity = new UserExternalIdentityEntity();
    externalIdentity.setUserId(user.getId());
    externalIdentity.setProvider(provider);
    externalIdentity.setProviderSubject(providerSubject);
    updateExternalIdentitySnapshot(externalIdentity, identity, normalizedEmail);
    externalIdentityRepository.save(externalIdentity);

    WorkspaceEntity workspace = personalWorkspaceService.getOrCreate(user);
    return buildSessionResponse(user, workspace);
  }

  private UserEntity createExternalUser(OAuthIdentity identity, String normalizedEmail) {
    UserEntity user = new UserEntity();
    user.setFullName(normalizeName(defaultExternalName(identity.displayName(), normalizedEmail)));
    user.setEmail(normalizedEmail);
    user.setPasswordHash(null);
    user.setLocalPasswordEnabled(false);
    return userRepository.save(user);
  }

  private UserEntity requireTrustedAutoLink(UserEntity user, OAuthIdentity identity) {
    if (!identity.emailAutoLinkTrusted()) {
      throw new ConflictException(
          "VINCULO_OAUTH_REQUER_LOGIN",
          "Entre com sua conta antes de vincular este provedor externo."
      );
    }
    return user;
  }

  private void updateExternalIdentitySnapshot(
      UserExternalIdentityEntity externalIdentity,
      OAuthIdentity identity,
      String normalizedEmail
  ) {
    externalIdentity.setEmail(normalizedEmail);
    externalIdentity.setEmailVerified(identity.emailVerified());
    externalIdentity.setDisplayName(trimToNull(identity.displayName()));
    externalIdentity.setAvatarUrl(trimToNull(identity.avatarUrl()));
  }

  private String normalizeProvider(String provider) {
    String normalized = provider == null ? "" : provider.trim().toLowerCase(Locale.ROOT);
    if (normalized.isBlank()) {
      throw new BadRequestException("PROVEDOR_OAUTH_INVALIDO", "Provedor OAuth nao suportado.");
    }
    return normalized;
  }

  private String normalizeExternalSubject(String providerSubject) {
    String normalized = providerSubject == null ? "" : providerSubject.trim();
    if (normalized.isBlank()) {
      throw new BadRequestException("OAUTH_SUBJECT_AUSENTE", "O provedor externo nao retornou identificador do usuario.");
    }
    return normalized;
  }

  private String trimToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isBlank() ? null : trimmed;
  }

  private String defaultExternalName(String displayName, String normalizedEmail) {
    String trimmedName = trimToNull(displayName);
    if (trimmedName != null) {
      return trimmedName;
    }

    int atIndex = normalizedEmail.indexOf('@');
    return atIndex > 0 ? normalizedEmail.substring(0, atIndex) : normalizedEmail;
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
      String avatarUrl,
      String locale,
      String timeZone,
      ApiDateTimeDto createdAt,
      boolean localPasswordEnabled,
      boolean externalIdentityLinked
  ) {
  }

  public record WorkspaceSummary(
      UUID id,
      String name,
      String avatarUrl,
      WorkspaceSubscriptionPlan subscriptionPlan,
      long storageUsedBytes,
      long storageQuotaBytes,
      ApiDateTimeDto createdAt
  ) {
  }
}
