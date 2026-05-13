package com.planthings.api.auth;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.oauth")
public class OAuthProperties {

  private URI frontendCallbackUrl;
  private URI webCallbackUrl;
  private URI mobileCallbackUrl;
  private URI mobileWebCallbackUrl;
  private long stateMinutes = 10;
  private long completionCodeMinutes = 5;
  private List<String> allowedRedirectPaths = new ArrayList<>(List.of("/"));
  private Map<String, Provider> providers = new LinkedHashMap<>();

  public URI getFrontendCallbackUrl() {
    return frontendCallbackUrl;
  }

  public void setFrontendCallbackUrl(URI frontendCallbackUrl) {
    this.frontendCallbackUrl = frontendCallbackUrl;
  }

  public URI getWebCallbackUrl() {
    return webCallbackUrl == null ? frontendCallbackUrl : webCallbackUrl;
  }

  public void setWebCallbackUrl(URI webCallbackUrl) {
    this.webCallbackUrl = webCallbackUrl;
  }

  public URI getMobileCallbackUrl() {
    return mobileCallbackUrl == null ? URI.create("planthings://oauth/callback") : mobileCallbackUrl;
  }

  public void setMobileCallbackUrl(URI mobileCallbackUrl) {
    this.mobileCallbackUrl = mobileCallbackUrl;
  }

  public URI getMobileWebCallbackUrl() {
    return mobileWebCallbackUrl == null ? getMobileCallbackUrl() : mobileWebCallbackUrl;
  }

  public void setMobileWebCallbackUrl(URI mobileWebCallbackUrl) {
    this.mobileWebCallbackUrl = mobileWebCallbackUrl;
  }

  public long getStateMinutes() {
    return stateMinutes;
  }

  public void setStateMinutes(long stateMinutes) {
    this.stateMinutes = stateMinutes;
  }

  public long getCompletionCodeMinutes() {
    return completionCodeMinutes;
  }

  public void setCompletionCodeMinutes(long completionCodeMinutes) {
    this.completionCodeMinutes = completionCodeMinutes;
  }

  public List<String> getAllowedRedirectPaths() {
    return allowedRedirectPaths;
  }

  public void setAllowedRedirectPaths(List<String> allowedRedirectPaths) {
    this.allowedRedirectPaths = allowedRedirectPaths;
  }

  public Map<String, Provider> getProviders() {
    return providers;
  }

  public void setProviders(Map<String, Provider> providers) {
    this.providers = providers;
  }

  public static class Provider {
    private String clientId = "";
    private String clientSecret = "";
    private String authorizationUri = "";
    private String tokenUri = "";
    private String redirectUri = "";
    private String issuer = "";
    private String jwkSetUri = "";
    private List<String> scopes = new ArrayList<>(List.of("openid", "profile", "email"));

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

    public String getAuthorizationUri() {
      return authorizationUri;
    }

    public void setAuthorizationUri(String authorizationUri) {
      this.authorizationUri = authorizationUri;
    }

    public String getTokenUri() {
      return tokenUri;
    }

    public void setTokenUri(String tokenUri) {
      this.tokenUri = tokenUri;
    }

    public String getRedirectUri() {
      return redirectUri;
    }

    public void setRedirectUri(String redirectUri) {
      this.redirectUri = redirectUri;
    }

    public String getIssuer() {
      return issuer;
    }

    public void setIssuer(String issuer) {
      this.issuer = issuer;
    }

    public String getJwkSetUri() {
      return jwkSetUri;
    }

    public void setJwkSetUri(String jwkSetUri) {
      this.jwkSetUri = jwkSetUri;
    }

    public List<String> getScopes() {
      return scopes;
    }

    public void setScopes(List<String> scopes) {
      this.scopes = scopes;
    }
  }
}
