package com.planthings.api.settings;

import com.planthings.api.auth.OAuthProperties;
import com.planthings.api.auth.UserEntity;
import com.planthings.api.common.error.ApiException;
import com.planthings.api.common.error.BadRequestException;
import java.util.Arrays;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class GmailMessageSender {

  private static final String GOOGLE_PROVIDER = "google";

  private final GmailConnectionRepository connectionRepository;
  private final OAuthProperties oauthProperties;
  private final GmailApiClient gmailApiClient;
  private final IntegrationTokenCipher tokenCipher;
  private final GmailConnectionStatusService connectionStatusService;

  public GmailMessageSender(
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

  @Transactional(noRollbackFor = BadRequestException.class)
  public Delivery send(UserEntity sender, Function<String, String> rawMessageFactory) {
    GmailConnectionEntity connection = connectionRepository.findByUserId(sender.getId())
        .filter(item -> item.getRevokedAt() == null)
        .orElseThrow(() -> new BadRequestException("GMAIL_NAO_CONECTADO", "Conecte o Gmail em Configuracoes antes de enviar e-mails."));

    requireSendScope(connection.getScopes());
    OAuthProperties.Provider providerConfig = requireGoogleProviderConfig();

    try {
      String refreshToken = tokenCipher.decrypt(connection.getEncryptedRefreshToken());
      GmailApiClient.GmailAccessToken accessToken = gmailApiClient.refreshAccessToken(providerConfig, refreshToken);
      if (StringUtils.hasText(accessToken.scope())) {
        requireSendScope(accessToken.scope());
      }

      String rawMessage = rawMessageFactory.apply(connection.getEmail());
      GmailApiClient.GmailSendResponse response = gmailApiClient.sendMessage(accessToken.accessToken(), rawMessage);
      connectionStatusService.rememberLastError(connection.getId(), null);
      return new Delivery(true, connection.getEmail(), response.id(), response.threadId());
    } catch (ApiException exception) {
      connectionStatusService.rememberLastError(connection.getId(), exception.getCode());
      throw exception;
    } catch (RuntimeException exception) {
      connectionStatusService.rememberLastError(connection.getId(), "GMAIL_ENVIO_CONVITE_FALHOU");
      throw new BadRequestException("GMAIL_ENVIO_CONVITE_FALHOU", "Nao foi possivel enviar o e-mail pelo Gmail.");
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

  public record Delivery(boolean emailSent, String sentFrom, String messageId, String threadId) {
  }
}
