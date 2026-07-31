package com.planthings.api.settings;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.integrations.github")
public class GitHubIntegrationProperties {

  public static final String REPO_SCOPE = "repo";

  private String clientId;
  private String clientSecret;
  private URI redirectUri;
  private URI frontendReturnUrl;
  private URI webReturnUrl;
  private URI mobileReturnUrl;
  private URI mobileWebReturnUrl;
  private long stateMinutes = 10;
  private List<String> scopes = new ArrayList<>(List.of(REPO_SCOPE));
  private URI apiBaseUrl = URI.create("https://api.github.com");
  private URI authorizationUri = URI.create("https://github.com/login/oauth/authorize");
  private URI tokenUri = URI.create("https://github.com/login/oauth/access_token");
  private long pollingIntervalMinutes = 5;
  private int pollingBatchSize = 50;
  private String apiVersion = "2022-11-28";
  private String userAgent = "PlanThings-API";

  public String getClientId() {
    return clientId;
  }

  public void setClientId(String clientId) {
    this.clientId = clientId;
  }

  public String getClientSecret() {
    return clientSecret;
  }

  public void setClientSecret(String clientSecret) {
    this.clientSecret = clientSecret;
  }

  public URI getRedirectUri() {
    return redirectUri;
  }

  public void setRedirectUri(URI redirectUri) {
    this.redirectUri = redirectUri;
  }

  public URI getFrontendReturnUrl() {
    return frontendReturnUrl;
  }

  public void setFrontendReturnUrl(URI frontendReturnUrl) {
    this.frontendReturnUrl = frontendReturnUrl;
  }

  public URI getWebReturnUrl() {
    return webReturnUrl == null ? frontendReturnUrl : webReturnUrl;
  }

  public void setWebReturnUrl(URI webReturnUrl) {
    this.webReturnUrl = webReturnUrl;
  }

  public URI getMobileReturnUrl() {
    return mobileReturnUrl == null ? URI.create("planthings://settings") : mobileReturnUrl;
  }

  public void setMobileReturnUrl(URI mobileReturnUrl) {
    this.mobileReturnUrl = mobileReturnUrl;
  }

  public URI getMobileWebReturnUrl() {
    return mobileWebReturnUrl == null ? getMobileReturnUrl() : mobileWebReturnUrl;
  }

  public void setMobileWebReturnUrl(URI mobileWebReturnUrl) {
    this.mobileWebReturnUrl = mobileWebReturnUrl;
  }

  public long getStateMinutes() {
    return stateMinutes;
  }

  public void setStateMinutes(long stateMinutes) {
    this.stateMinutes = stateMinutes;
  }

  public List<String> getScopes() {
    return scopes;
  }

  public void setScopes(List<String> scopes) {
    this.scopes = scopes;
  }

  public URI getApiBaseUrl() {
    return apiBaseUrl;
  }

  public void setApiBaseUrl(URI apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  public URI getAuthorizationUri() {
    return authorizationUri;
  }

  public void setAuthorizationUri(URI authorizationUri) {
    this.authorizationUri = authorizationUri;
  }

  public URI getTokenUri() {
    return tokenUri;
  }

  public void setTokenUri(URI tokenUri) {
    this.tokenUri = tokenUri;
  }

  public long getPollingIntervalMinutes() {
    return pollingIntervalMinutes;
  }

  public void setPollingIntervalMinutes(long pollingIntervalMinutes) {
    this.pollingIntervalMinutes = pollingIntervalMinutes;
  }

  public int getPollingBatchSize() {
    return pollingBatchSize;
  }

  public void setPollingBatchSize(int pollingBatchSize) {
    this.pollingBatchSize = pollingBatchSize;
  }

  public String getApiVersion() {
    return apiVersion;
  }

  public void setApiVersion(String apiVersion) {
    this.apiVersion = apiVersion;
  }

  public String getUserAgent() {
    return userAgent;
  }

  public void setUserAgent(String userAgent) {
    this.userAgent = userAgent;
  }
}
