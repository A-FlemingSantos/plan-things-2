package com.planthings.api.settings;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planthings.api.auth.OAuthProperties;
import com.planthings.api.common.error.BadRequestException;
import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class DefaultGmailApiClient implements GmailApiClient {

  private static final Logger logger = LoggerFactory.getLogger(DefaultGmailApiClient.class);
  private static final String GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

  private final RestClient restClient;
  private final ObjectMapper objectMapper;

  public DefaultGmailApiClient(RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
    this.restClient = restClientBuilder.build();
    this.objectMapper = objectMapper;
  }

  @Override
  public GmailAccessToken refreshAccessToken(OAuthProperties.Provider config, String refreshToken) {
    LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("grant_type", "refresh_token");
    form.add("refresh_token", refreshToken);
    form.add("client_id", config.getClientId());
    form.add("client_secret", config.getClientSecret());

    try {
      TokenRefreshResponse response = restClient.post()
          .uri(config.getTokenUri())
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(form)
          .retrieve()
          .body(TokenRefreshResponse.class);

      if (response == null || !StringUtils.hasText(response.accessToken())) {
        throw new BadRequestException("GMAIL_TOKEN_REFRESH_FALHOU", "Nao foi possivel renovar a autorizacao Gmail.");
      }

      return new GmailAccessToken(response.accessToken(), response.scope());
    } catch (BadRequestException exception) {
      throw exception;
    } catch (RestClientResponseException exception) {
      logger.warn("Gmail token refresh failed status={} body={}", exception.getStatusCode(), exception.getResponseBodyAsString());
      throw new BadRequestException("GMAIL_TOKEN_REFRESH_FALHOU", "Nao foi possivel renovar a autorizacao Gmail.");
    } catch (RuntimeException exception) {
      logger.warn("Gmail token refresh failed before response", exception);
      throw new BadRequestException("GMAIL_TOKEN_REFRESH_FALHOU", "Nao foi possivel renovar a autorizacao Gmail.");
    }
  }

  @Override
  public GmailSendResponse sendMessage(String accessToken, String rawMessage) {
    try {
      SendResponse response = restClient.post()
          .uri(GMAIL_SEND_URL)
          .headers(headers -> headers.setBearerAuth(accessToken))
          .contentType(MediaType.APPLICATION_JSON)
          .body(Map.of("raw", rawMessage))
          .retrieve()
          .body(SendResponse.class);

      return new GmailSendResponse(response == null ? null : response.id(), response == null ? null : response.threadId());
    } catch (RestClientResponseException exception) {
      BadRequestException mappedException = mapSendFailure(exception);
      logger.warn(
          "Gmail message send failed status={} code={} reason={} message={}",
          exception.getStatusCode(),
          mappedException.getCode(),
          googleErrorReason(exception.getResponseBodyAsString()),
          googleErrorMessage(exception.getResponseBodyAsString())
      );
      throw mappedException;
    } catch (RuntimeException exception) {
      logger.warn("Gmail message send failed before response", exception);
      throw new BadRequestException("GMAIL_ENVIO_CONVITE_FALHOU", "Nao foi possivel enviar o convite pelo Gmail.");
    }
  }

  private BadRequestException mapSendFailure(RestClientResponseException exception) {
    String body = exception.getResponseBodyAsString();
    String reason = googleErrorReason(body);
    String message = googleErrorMessage(body);
    String failureText = (reason + " " + message + " " + body).toLowerCase(Locale.ROOT);

    if (failureText.contains("service_disabled")
        || failureText.contains("accessnotconfigured")
        || failureText.contains("api has not been used")
        || failureText.contains("it is disabled")) {
      return new BadRequestException("GMAIL_API_NAO_HABILITADA", "A API do Gmail nao esta habilitada no projeto Google Cloud.");
    }

    if (failureText.contains("insufficientpermissions")
        || failureText.contains("insufficient authentication scopes")
        || failureText.contains("insufficient permission")) {
      return new BadRequestException("GMAIL_SCOPE_AUSENTE", "A conexao Gmail nao tem permissao para enviar e-mails.");
    }

    return new BadRequestException("GMAIL_ENVIO_CONVITE_FALHOU", "Nao foi possivel enviar o convite pelo Gmail.");
  }

  private String googleErrorReason(String body) {
    JsonNode error = googleError(body);
    if (error == null) {
      return "";
    }

    JsonNode errors = error.path("errors");
    if (errors.isArray() && !errors.isEmpty()) {
      String reason = errors.get(0).path("reason").asText("");
      if (StringUtils.hasText(reason)) {
        return reason;
      }
    }

    JsonNode details = error.path("details");
    if (details.isArray()) {
      for (JsonNode detail : details) {
        String reason = detail.path("reason").asText("");
        if (StringUtils.hasText(reason)) {
          return reason;
        }
      }
    }

    return error.path("status").asText("");
  }

  private String googleErrorMessage(String body) {
    JsonNode error = googleError(body);
    return error == null ? "" : error.path("message").asText("");
  }

  private JsonNode googleError(String body) {
    if (!StringUtils.hasText(body)) {
      return null;
    }
    try {
      return objectMapper.readTree(body).path("error");
    } catch (IOException exception) {
      return null;
    }
  }

  private record TokenRefreshResponse(
      @JsonProperty("access_token")
      String accessToken,
      @JsonProperty("token_type")
      String tokenType,
      @JsonProperty("expires_in")
      Integer expiresIn,
      String scope
  ) {
  }

  private record SendResponse(String id, String threadId) {
  }
}
