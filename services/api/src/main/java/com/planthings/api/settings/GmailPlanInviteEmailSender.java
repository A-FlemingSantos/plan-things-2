package com.planthings.api.settings;

import com.planthings.api.auth.OAuthProperties;
import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.error.ApiException;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.plans.PlanInviteEmailSender;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class GmailPlanInviteEmailSender implements PlanInviteEmailSender {

  private static final String GOOGLE_PROVIDER = "google";

  private final GmailConnectionRepository connectionRepository;
  private final OAuthProperties oauthProperties;
  private final GmailApiClient gmailApiClient;
  private final IntegrationTokenCipher tokenCipher;
  private final GmailConnectionStatusService connectionStatusService;

  public GmailPlanInviteEmailSender(
      GmailConnectionRepository connectionRepository,
      OAuthProperties oauthProperties,
      GmailApiClient gmailApiClient,
      IntegrationTokenCipher tokenCipher,
      GmailConnectionStatusService connectionStatusService
  ) {
    this.connectionRepository = connectionRepository;
    this.oauthProperties = oauthProperties;
    this.gmailApiClient = gmailApiClient;
    this.tokenCipher = tokenCipher;
    this.connectionStatusService = connectionStatusService;
  }

  @Override
  @Transactional
  public Delivery sendInvite(
      UserEntity inviter,
      String invitedEmail,
      String planName,
      String inviteUrl,
      ApiDateTimeDto expiresAt
  ) {
    GmailConnectionEntity connection = connectionRepository.findByUserId(inviter.getId())
        .filter(item -> item.getRevokedAt() == null)
        .orElseThrow(() -> new BadRequestException("GMAIL_NAO_CONECTADO", "Conecte o Gmail em Configuracoes antes de enviar convites por e-mail."));

    requireSendScope(connection.getScopes());
    OAuthProperties.Provider providerConfig = requireGoogleProviderConfig();

    try {
      String refreshToken = tokenCipher.decrypt(connection.getEncryptedRefreshToken());
      GmailApiClient.GmailAccessToken accessToken = gmailApiClient.refreshAccessToken(providerConfig, refreshToken);
      if (StringUtils.hasText(accessToken.scope())) {
        requireSendScope(accessToken.scope());
      }

      String rawMessage = encodeMimeMessage(buildInviteMime(connection.getEmail(), invitedEmail, inviter.getFullName(), planName, inviteUrl, expiresAt));
      gmailApiClient.sendMessage(accessToken.accessToken(), rawMessage);
      connectionStatusService.rememberLastError(connection.getId(), null);
      return new Delivery(true, invitedEmail, connection.getEmail());
    } catch (ApiException exception) {
      connectionStatusService.rememberLastError(connection.getId(), exception.getCode());
      throw exception;
    } catch (RuntimeException exception) {
      connectionStatusService.rememberLastError(connection.getId(), "GMAIL_ENVIO_CONVITE_FALHOU");
      throw new BadRequestException("GMAIL_ENVIO_CONVITE_FALHOU", "Nao foi possivel enviar o convite pelo Gmail.");
    }
  }

  private void requireSendScope(String scopes) {
    boolean hasSendScope = Arrays.stream((scopes == null ? "" : scopes).trim().split("\\s+"))
        .anyMatch(GmailIntegrationProperties.GMAIL_SEND_SCOPE::equals);
    if (!hasSendScope) {
      throw new BadRequestException("GMAIL_SCOPE_AUSENTE", "A conexao Gmail nao tem permissao para enviar e-mails.");
    }
  }

  private OAuthProperties.Provider requireGoogleProviderConfig() {
    OAuthProperties.Provider providerConfig = oauthProperties.getProviders().get(GOOGLE_PROVIDER);
    if (providerConfig == null
        || !StringUtils.hasText(providerConfig.getClientId())
        || !StringUtils.hasText(providerConfig.getClientSecret())
        || !StringUtils.hasText(providerConfig.getTokenUri())) {
      throw new BadRequestException("PROVEDOR_OAUTH_INDISPONIVEL", "A conexao Google ainda nao esta configurada.");
    }
    return providerConfig;
  }

  private String buildInviteMime(
      String senderEmail,
      String invitedEmail,
      String inviterName,
      String planName,
      String inviteUrl,
      ApiDateTimeDto expiresAt
  ) {
    String boundary = "planthings-" + UUID.randomUUID();
    String subject = "Convite para o plano " + planName + " - Plan Things";
    String safePlanName = htmlEscape(planName);
    String safeInviterName = htmlEscape(inviterName);
    String safeInviteUrl = htmlEscape(inviteUrl);
    String expiresText = expiresAt == null ? "" : expiresAt.text();
    String safeExpiresText = htmlEscape(expiresText);

    String textBody = """
        Ola,

        %s convidou voce para participar do plano %s no Plan Things.

        Acesse o convite:
        %s

        Este convite expira em %s.
        """.formatted(inviterName, planName, inviteUrl, expiresText);

    String htmlBody = """
        <!doctype html>
        <html>
          <body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
            <p>Ola,</p>
            <p><strong>%s</strong> convidou voce para participar do plano <strong>%s</strong> no Plan Things.</p>
            <p>
              <a href="%s" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px">
                Aceitar convite
              </a>
            </p>
            <p>Ou acesse este link: <a href="%s">%s</a></p>
            <p style="color:#6b7280;font-size:13px">Este convite expira em %s.</p>
          </body>
        </html>
        """.formatted(safeInviterName, safePlanName, safeInviteUrl, safeInviteUrl, safeInviteUrl, safeExpiresText);

    return String.join("\r\n",
        "From: " + headerValue(senderEmail),
        "To: " + headerValue(invitedEmail),
        "Subject: " + encodedHeader(subject),
        "MIME-Version: 1.0",
        "Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
        "",
        "--" + boundary,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        encodedBody(textBody),
        "--" + boundary,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        encodedBody(htmlBody),
        "--" + boundary + "--",
        ""
    );
  }

  private String encodeMimeMessage(String mimeMessage) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(mimeMessage.getBytes(StandardCharsets.UTF_8));
  }

  private String encodedHeader(String value) {
    return "=?UTF-8?B?" + Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8)) + "?=";
  }

  private String encodedBody(String value) {
    byte[] lineSeparator = "\r\n".getBytes(StandardCharsets.US_ASCII);
    return Base64.getMimeEncoder(76, lineSeparator).encodeToString(value.getBytes(StandardCharsets.UTF_8));
  }

  private String headerValue(String value) {
    return (value == null ? "" : value).replace("\r", "").replace("\n", "");
  }

  private String htmlEscape(String value) {
    return (value == null ? "" : value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;");
  }

}
