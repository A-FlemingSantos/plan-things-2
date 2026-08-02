package com.planthings.api.github;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public interface GitHubApiClient {

  List<GitHubRepository> searchAccessibleRepositories(String accessToken, String query, int page, int perPage);

  GitHubRepository getRepository(String accessToken, String owner, String repo);

  GitHubIssue getIssue(String accessToken, String owner, String repo, int number);

  GitHubPullRequest getPullRequest(String accessToken, String owner, String repo, int number);

  GitHubBranch getBranch(String accessToken, String owner, String repo, String branchName);

  GitHubCommit getCommit(String accessToken, String owner, String repo, String sha);

  List<GitHubSearchItem> searchIssuesAndPullRequests(String accessToken, String query, int page, int perPage);

  List<GitHubSearchItem> searchBranches(String accessToken, String owner, String repo, String query, int page, int perPage);

  List<GitHubSearchItem> searchCommits(String accessToken, String owner, String repo, String query, int page, int perPage);

  GitHubUser getAuthenticatedUser(String accessToken);

  GitHubRefreshResult<GitHubIssue> refreshIssue(String accessToken, String owner, String repo, int number, String ifNoneMatch);

  GitHubRefreshResult<GitHubPullRequest> refreshPullRequest(
      String accessToken,
      String owner,
      String repo,
      int number,
      String ifNoneMatch
  );

  GitHubRefreshResult<GitHubBranch> refreshBranch(
      String accessToken,
      String owner,
      String repo,
      String branchName,
      String ifNoneMatch
  );

  GitHubRefreshResult<GitHubCommit> refreshCommit(String accessToken, String owner, String repo, String sha, String ifNoneMatch);

  record GitHubRefreshResult<T>(boolean notModified, String etag, T payload) {
  }

  record GitHubRepository(
      long id,
      String fullName,
      String description,
      boolean isPrivate,
      String ownerAvatarUrl,
      String defaultBranch
  ) {
  }

  record GitHubIssue(
      long id,
      int number,
      String title,
      String state,
      String htmlUrl,
      String body,
      JsonNode labels,
      JsonNode assignees,
      JsonNode milestone,
      JsonNode user,
      int comments,
      String createdAt,
      String updatedAt
  ) {
  }

  record GitHubPullRequest(
      long id,
      int number,
      String title,
      String state,
      boolean merged,
      boolean draft,
      String htmlUrl,
      String body,
      JsonNode labels,
      JsonNode user,
      JsonNode base,
      JsonNode head,
      JsonNode requestedReviewers,
      int comments,
      int commits,
      int changedFiles,
      int additions,
      int deletions,
      String createdAt,
      String updatedAt,
      JsonNode statusesUrl
  ) {
  }

  record GitHubBranch(
      String name,
      String htmlUrl,
      boolean isDefault,
      int aheadBy,
      int behindBy,
      String lastCommitSha,
      String lastCommitMessage,
      String lastCommitAt,
      JsonNode commits
  ) {
  }

  record GitHubCommit(
      String sha,
      String htmlUrl,
      String message,
      JsonNode author,
      JsonNode committer,
      JsonNode files,
      int additions,
      int deletions,
      int changedFiles,
      String committedAt
  ) {
  }

  record GitHubSearchItem(
      String id,
      GitHubLinkType type,
      String repoFullName,
      String title,
      String url,
      String number,
      String status,
      String authorName,
      String authorAvatarUrl,
      String createdAt,
      String updatedAt,
      List<String> labelNames,
      String bodyPreview,
      Integer commentsCount,
      String baseBranch,
      String headBranch,
      GitHubCommitDiff diffStat,
      Boolean isDefaultBranch,
      Integer aheadBy,
      Integer behindBy,
      String lastCommitSha,
      String lastCommitMessage,
      String sha,
      String message
  ) {
  }

  record GitHubCommitDiff(
      int additions,
      int deletions,
      int changedFiles,
      @JsonProperty("patch") String patchPreview
  ) {
    @JsonProperty("diff")
    public String diff() {
      return patchPreview;
    }
  }

  record GitHubUser(long id, String login, String avatarUrl) {
  }
}

