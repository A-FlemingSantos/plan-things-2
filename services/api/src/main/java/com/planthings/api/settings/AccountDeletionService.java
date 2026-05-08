package com.planthings.api.settings;

import com.planthings.api.auth.UserEntity;
import com.planthings.api.auth.UserSessionService;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.workspace.WorkspaceEntity;
import com.planthings.api.workspace.WorkspaceRepository;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountDeletionService {

  private static final UUID TOMBSTONE_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
  private static final String TOMBSTONE_EMAIL = "deleted-user@planthings.local";
  private static final String REQUIRED_CONFIRMATION_PHRASE = "EXCLUIR MINHA CONTA";

  private final AuthenticatedUserService authenticatedUserService;
  private final WorkspaceRepository workspaceRepository;
  private final PasswordEncoder passwordEncoder;
  private final UserSessionService userSessionService;
  private final NamedParameterJdbcTemplate jdbcTemplate;

  public AccountDeletionService(
      AuthenticatedUserService authenticatedUserService,
      WorkspaceRepository workspaceRepository,
      PasswordEncoder passwordEncoder,
      UserSessionService userSessionService,
      NamedParameterJdbcTemplate jdbcTemplate
  ) {
    this.authenticatedUserService = authenticatedUserService;
    this.workspaceRepository = workspaceRepository;
    this.passwordEncoder = passwordEncoder;
    this.userSessionService = userSessionService;
    this.jdbcTemplate = jdbcTemplate;
  }

  @Transactional
  public SettingsService.MessageResponse deleteCurrentAccount(String confirmEmail, String confirmPhrase, String currentPassword) {
    UserEntity user = authenticatedUserService.requireUser();
    UUID userId = user.getId();
    UUID workspaceId = workspaceRepository.findByOwnerUserId(userId).map(WorkspaceEntity::getId).orElse(null);

    validateConfirmation(user, confirmEmail, confirmPhrase, currentPassword);
    userSessionService.revokeAllSessions(userId);

    MapSqlParameterSource params = baseParams(userId, workspaceId, user.getEmail());

    jdbcTemplate.update("delete from plan_invites where lower(invited_email) = lower(:email)", params);
    jdbcTemplate.update("delete from board_card_inbox_delivery_recipients where user_id = :userId", params);
    jdbcTemplate.update("delete from board_card_assignees where user_id = :userId", params);
    jdbcTemplate.update("update board_checklist_items set assignee_user_id = null where assignee_user_id = :userId", params);
    jdbcTemplate.update("""
        update board_cards
        set author_user_id = :tombstoneUserId
        where author_user_id = :userId
          and (:workspaceId is null or plan_id in (select id from plans where workspace_id <> :workspaceId))
        """, params);
    jdbcTemplate.update("""
        update board_card_comments
        set author_user_id = :tombstoneUserId
        where author_user_id = :userId
          and (:workspaceId is null or card_id in (
              select cards.id
              from board_cards cards
              join plans plans on plans.id = cards.plan_id
              where plans.workspace_id <> :workspaceId
          ))
        """, params);
    jdbcTemplate.update("""
        update board_card_inbox_deliveries
        set sent_by_user_id = :tombstoneUserId,
            sent_from = :tombstoneEmail
        where sent_by_user_id = :userId
          and (:workspaceId is null or plan_id in (select id from plans where workspace_id <> :workspaceId))
        """, params);
    jdbcTemplate.update("""
        update plan_invites
        set inviter_user_id = :tombstoneUserId
        where inviter_user_id = :userId
          and (:workspaceId is null or plan_id in (select id from plans where workspace_id <> :workspaceId))
        """, params);
    jdbcTemplate.update("""
        update calendar_events
        set creator_user_id = :tombstoneUserId
        where creator_user_id = :userId
          and (:workspaceId is null or workspace_id <> :workspaceId)
        """, params);
    jdbcTemplate.update("""
        update file_plan_shares
        set shared_by_user_id = :tombstoneUserId
        where shared_by_user_id = :userId
          and file_entry_id in (
              select entry.id
              from file_entries entry
              where :workspaceId is null or entry.workspace_id <> :workspaceId
          )
        """, params);
    jdbcTemplate.update("""
        update card_attachments
        set attached_by_user_id = :tombstoneUserId
        where attached_by_user_id = :userId
          and card_id in (
              select cards.id
              from board_cards cards
              join plans plans on plans.id = cards.plan_id
              where :workspaceId is null or plans.workspace_id <> :workspaceId
          )
        """, params);
    jdbcTemplate.update("""
        delete from plan_members
        where user_id = :userId
          and plan_id in (
              select id
              from plans
              where :workspaceId is null or workspace_id <> :workspaceId
          )
        """, params);

    jdbcTemplate.update("update file_entries set parent_id = null where owner_user_id = :userId", params);
    jdbcTemplate.update("delete from file_entries where owner_user_id = :userId", params);
    jdbcTemplate.update("delete from avatar_images where owner_type = 'USER' and owner_id = :userId", params);

    if (workspaceId != null) {
      jdbcTemplate.update("""
          delete from board_card_inbox_deliveries
          where plan_id in (select id from plans where workspace_id = :workspaceId)
          """, params);
      jdbcTemplate.update("delete from calendar_events where workspace_id = :workspaceId", params);
      jdbcTemplate.update("delete from avatar_images where owner_type = 'WORKSPACE' and owner_id = :workspaceId", params);
      jdbcTemplate.update("delete from plans where workspace_id = :workspaceId", params);
      jdbcTemplate.update("delete from workspaces where id = :workspaceId", params);
    }

    jdbcTemplate.update("delete from password_reset_tokens where user_id = :userId", params);
    jdbcTemplate.update("delete from users where id = :userId", params);

    return new SettingsService.MessageResponse("Conta excluida com sucesso.");
  }

  private void validateConfirmation(UserEntity user, String confirmEmail, String confirmPhrase, String currentPassword) {
    String normalizedEmail = confirmEmail == null ? "" : confirmEmail.trim();
    if (!user.getEmail().equalsIgnoreCase(normalizedEmail)) {
      throw new BadRequestException("EMAIL_CONFIRMACAO_INVALIDO", "Confirme o e-mail exato da conta para continuar.");
    }

    String normalizedPhrase = confirmPhrase == null ? "" : confirmPhrase.trim();
    if (!REQUIRED_CONFIRMATION_PHRASE.equals(normalizedPhrase)) {
      throw new BadRequestException("FRASE_CONFIRMACAO_INVALIDA", "Digite a frase de confirmacao exatamente como exibida.");
    }

    if (user.isLocalPasswordEnabled() && user.getPasswordHash() != null) {
      if (currentPassword == null || currentPassword.isBlank()) {
        throw new BadRequestException("SENHA_ATUAL_OBRIGATORIA", "Informe sua senha atual para excluir a conta.");
      }
      if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
        throw new BadRequestException("SENHA_ATUAL_INVALIDA", "A senha atual informada esta incorreta.");
      }
    }
  }

  private MapSqlParameterSource baseParams(UUID userId, UUID workspaceId, String email) {
    return new MapSqlParameterSource()
        .addValue("userId", userId)
        .addValue("workspaceId", workspaceId)
        .addValue("email", email)
        .addValue("tombstoneUserId", TOMBSTONE_USER_ID)
        .addValue("tombstoneEmail", TOMBSTONE_EMAIL);
  }
}
