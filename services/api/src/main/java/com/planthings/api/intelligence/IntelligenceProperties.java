package com.planthings.api.intelligence;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "app.intelligence")
public class IntelligenceProperties {

  private boolean enabled;
  private String apiKey = "";
  private String model = "gpt-5.4-mini";
  private String reasoningEffort = "low";
  private int maxOutputTokens = 6000;
  private boolean useOpenaiConversations;
  private boolean storeOpenaiResponses;
  private int compactThreshold = 120_000;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getApiKey() {
    return apiKey;
  }

  public void setApiKey(String apiKey) {
    this.apiKey = apiKey == null ? "" : apiKey;
  }

  public String getModel() {
    return model;
  }

  public void setModel(String model) {
    this.model = model;
  }

  public String getReasoningEffort() {
    return reasoningEffort;
  }

  public void setReasoningEffort(String reasoningEffort) {
    this.reasoningEffort = reasoningEffort;
  }

  public int getMaxOutputTokens() {
    return maxOutputTokens;
  }

  public void setMaxOutputTokens(int maxOutputTokens) {
    this.maxOutputTokens = maxOutputTokens;
  }

  public boolean isUseOpenaiConversations() {
    return useOpenaiConversations;
  }

  public void setUseOpenaiConversations(boolean useOpenaiConversations) {
    this.useOpenaiConversations = useOpenaiConversations;
  }

  public boolean isStoreOpenaiResponses() {
    return storeOpenaiResponses;
  }

  public void setStoreOpenaiResponses(boolean storeOpenaiResponses) {
    this.storeOpenaiResponses = storeOpenaiResponses;
  }

  public int getCompactThreshold() {
    return compactThreshold;
  }

  public void setCompactThreshold(int compactThreshold) {
    this.compactThreshold = compactThreshold;
  }

  public boolean isConfigured() {
    return enabled && StringUtils.hasText(apiKey);
  }
}
