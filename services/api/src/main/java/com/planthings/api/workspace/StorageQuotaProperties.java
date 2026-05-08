package com.planthings.api.workspace;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageQuotaProperties {

  private long basicBytes = 2L * 1024L * 1024L * 1024L;
  private long professionalBytes = 50L * 1024L * 1024L * 1024L;
  private long teamBytes = 500L * 1024L * 1024L * 1024L;

  public long getBasicBytes() {
    return basicBytes;
  }

  public void setBasicBytes(long basicBytes) {
    this.basicBytes = basicBytes;
  }

  public long getProfessionalBytes() {
    return professionalBytes;
  }

  public void setProfessionalBytes(long professionalBytes) {
    this.professionalBytes = professionalBytes;
  }

  public long getTeamBytes() {
    return teamBytes;
  }

  public void setTeamBytes(long teamBytes) {
    this.teamBytes = teamBytes;
  }
}

