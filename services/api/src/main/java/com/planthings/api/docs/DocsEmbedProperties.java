package com.planthings.api.docs;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "app.docs.embeds")
public class DocsEmbedProperties {

  private Unsplash unsplash = new Unsplash();
  private YouTube youtube = new YouTube();

  public Unsplash getUnsplash() {
    return unsplash;
  }

  public void setUnsplash(Unsplash unsplash) {
    this.unsplash = unsplash == null ? new Unsplash() : unsplash;
  }

  public YouTube getYoutube() {
    return youtube;
  }

  public void setYoutube(YouTube youtube) {
    this.youtube = youtube == null ? new YouTube() : youtube;
  }

  public static class Unsplash {

    private String accessKey = "";

    public String getAccessKey() {
      return accessKey;
    }

    public void setAccessKey(String accessKey) {
      this.accessKey = accessKey == null ? "" : accessKey;
    }

    public boolean isConfigured() {
      return StringUtils.hasText(accessKey);
    }
  }

  public static class YouTube {

    private String apiKey = "";

    public String getApiKey() {
      return apiKey;
    }

    public void setApiKey(String apiKey) {
      this.apiKey = apiKey == null ? "" : apiKey;
    }

    public boolean isConfigured() {
      return StringUtils.hasText(apiKey);
    }
  }
}
