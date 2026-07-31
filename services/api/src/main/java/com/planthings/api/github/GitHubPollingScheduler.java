package com.planthings.api.github;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class GitHubPollingScheduler {

  private static final Logger logger = LoggerFactory.getLogger(GitHubPollingScheduler.class);

  private final GitHubLinkSyncService linkSyncService;

  public GitHubPollingScheduler(GitHubLinkSyncService linkSyncService) {
    this.linkSyncService = linkSyncService;
  }

  @Scheduled(fixedDelayString = "${app.integrations.github.polling-interval-ms:300000}")
  public void pollGitHubLinks() {
    int synced = linkSyncService.syncDueLinks();
    if (synced > 0) {
      logger.debug("GitHub polling synced {} links", synced);
    }
  }
}
