package com.planthings.api.settings;

import com.planthings.api.auth.OAuthProperties;

public interface GmailApiClient {

  GmailAccessToken refreshAccessToken(OAuthProperties.Provider config, String refreshToken);

  GmailSendResponse sendMessage(String accessToken, String rawMessage);

  record GmailAccessToken(String accessToken, String scope) {
  }

  record GmailSendResponse(String id, String threadId) {
  }
}
