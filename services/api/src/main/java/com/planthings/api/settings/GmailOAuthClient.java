package com.planthings.api.settings;

import com.planthings.api.auth.OAuthProperties;

public interface GmailOAuthClient {

  GmailTokenResponse exchangeCode(
      OAuthProperties.Provider config,
      String authorizationCode,
      String redirectUri,
      String expectedNonce
  );

  record GmailTokenResponse(
      String email,
      boolean emailVerified,
      String refreshToken,
      String scope
  ) {
  }
}
