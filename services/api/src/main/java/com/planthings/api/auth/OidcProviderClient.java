package com.planthings.api.auth;

public interface OidcProviderClient {

  OAuthIdentity exchangeCode(String provider, OAuthProperties.Provider config, String authorizationCode, String expectedNonce);
}
