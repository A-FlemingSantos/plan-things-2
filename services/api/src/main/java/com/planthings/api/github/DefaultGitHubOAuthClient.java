package com.planthings.api.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.common.error.BadRequestException;
import com.planthings.api.settings.GitHubIntegrationProperties;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.StringUtils;

@Component
public class DefaultGitHubOAuthClient implements GitHubOAuthClient {

  private final GitHubRestExecutor restExecutor;
  private final GitHubIntegrationProperties properties;

  public DefaultGitHubOAuthClient(GitHubRestExecutor restExecutor, GitHubIntegrationProperties properties) {
    this.restExecutor = restExecutor;
    this.properties = properties;
  }

  @Override
  public GitHubTokenResponse exchangeCode(String authorizationCode, String redirectUri) {
    LinkedMultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("client_id", properties.getClientId());
    form.add("client_secret", properties.getClientSecret());
    form.add("code", authorizationCode);
    form.add("redirect_uri", redirectUri);

    HttpHeaders requestHeaders = new HttpHeaders();
    requestHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
    requestHeaders.set(HttpHeaders.ACCEPT, "application/vnd.github+json");

    GitHubRestExecutor.GitHubHttpResponse response = restExecutor.postForm(
        properties.getTokenUri().toString(),
        requestHeaders,
        form
    );

    JsonNode body = response.requireBody();
    if (StringUtils.hasText(body.path("error").asText(null))) {
      throw new BadRequestException("GITHUB_PROVIDER_ERROR", "O GitHub recusou a autorizacao.");
    }
    String accessToken = body.path("access_token").asText(null);
    if (!StringUtils.hasText(accessToken)) {
      throw new BadRequestException("GITHUB_TOKEN_EXCHANGE_FALHOU", "Nao foi possivel validar a conexao GitHub.");
    }
    String scope = body.path("scope").asText(null);
    String tokenType = body.path("token_type").asText(null);

    GitHubRestExecutor.GitHubHttpResponse userResponse = restExecutor.get(accessToken, "/user");
    List<String> grantedScopes = GitHubRestExecutor.parseGrantedScopes(
        userResponse.headers().getFirst("X-OAuth-Scopes"),
        scope
    );
    GitHubRestExecutor.requireRepoScope(grantedScopes);

    return new GitHubTokenResponse(accessToken, String.join(",", grantedScopes), tokenType);
  }
}
