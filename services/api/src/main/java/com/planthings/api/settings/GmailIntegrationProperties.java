package com.planthings.api.settings;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.integrations.gmail")
public class GmailIntegrationProperties {

  public static final String GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

  private URI redirectUri;
  private URI frontendReturnUrl;
  private URI webReturnUrl;
  private URI mobileReturnUrl;
  private URI mobileWebReturnUrl;
  private long stateMinutes = 10;
  private List<String> scopes = new ArrayList<>(List.of(
      "openid",
      "profile",
      "email",
      GMAIL_SEND_SCOPE
  ));

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
}
