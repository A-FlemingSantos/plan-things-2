package com.planthings.api.github;

public interface GitHubOAuthClient {

  GitHubTokenResponse exchangeCode(String authorizationCode, String redirectUri);

  record GitHubTokenResponse(
      String accessToken,
      String scope,
      String tokenType
  ) {
  }
}
