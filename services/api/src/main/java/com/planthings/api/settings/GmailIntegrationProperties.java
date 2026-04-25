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

  private URI redirectUri = URI.create("http://localhost:8080/api/settings/integrations/gmail/callback");
  private URI frontendReturnUrl = URI.create("http://localhost:5173/settings");
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
