package com.planthings.api.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planthings.api.common.api.ApiDateTimeDto;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class GitHubLinkMapper {

  private final ObjectMapper objectMapper;
  private final BrazilDateTimeMapper dateTimeMapper;

  public GitHubLinkMapper(ObjectMapper objectMapper, BrazilDateTimeMapper dateTimeMapper) {
    this.objectMapper = objectMapper;
    this.dateTimeMapper = dateTimeMapper;
  }

  public GitHubLinkedItemView toLinkedItemView(BoardCardGitHubLinkEntity link) {
    JsonNode snapshot = parseSnapshot(link.getSnapshotJson());
    return new GitHubLinkedItemView(
        link.getId().toString(),
        link.getLinkType().toApiValue(),
        link.getRepoFullName(),
        link.getTitle(),
        link.getUrl(),
        formatNumber(link),
        link.getStatus(),
        null,
        null,
        extractSnapshotUpdatedAt(link.getLinkType(), snapshot),
        List.of(),
        extractBodyPreview(link.getSnapshotJson()),
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        link.getGithubSha(),
        link.getTitle(),
        snapshot,
        Boolean.TRUE.equals(link.getUnavailable()),
        Boolean.TRUE.equals(link.getCompletionAnchor()),
        formatUpdatedAt(link.getCreatedAt()),
        link.getLinkedByUserId() == null ? null : link.getLinkedByUserId().toString()
    );
  }

  public GitHubLinkedItemView toSearchItemView(GitHubApiClient.GitHubSearchItem item) {
    ObjectNode snapshot = buildSearchSnapshot(item);
    return new GitHubLinkedItemView(
        item.id(),
        item.type().toApiValue(),
        item.repoFullName(),
        item.title(),
        item.url(),
        item.number(),
        item.status(),
        item.authorName(),
        item.authorAvatarUrl(),
        item.updatedAt(),
        item.labelNames() == null ? List.of() : item.labelNames(),
        item.bodyPreview(),
        item.commentsCount(),
        item.baseBranch(),
        item.headBranch(),
        item.diffStat() == null ? null : new GitHubDiffStatView(
            item.diffStat().additions(),
            item.diffStat().deletions(),
            item.diffStat().changedFiles()
        ),
        item.isDefaultBranch(),
        item.aheadBy(),
        item.behindBy(),
        item.lastCommitSha(),
        item.lastCommitMessage(),
        item.sha(),
        item.message(),
        snapshot.isEmpty() ? null : snapshot,
        false,
        false,
        null,
        null
    );
  }

  public String buildSnapshotJson(GitHubApiClient.GitHubIssue issue) {
    ObjectNode node = objectMapper.createObjectNode();
    node.put("body", issue.body());
    node.set("labels", issue.labels());
    node.set("assignees", issue.assignees());
    node.set("milestone", issue.milestone());
    node.put("comments", issue.comments());
    node.put("createdAt", issue.createdAt());
    node.put("updatedAt", issue.updatedAt());
    return write(node);
  }

  public String buildSnapshotJson(GitHubApiClient.GitHubPullRequest pullRequest) {
    ObjectNode node = objectMapper.createObjectNode();
    node.put("body", pullRequest.body());
    node.set("labels", pullRequest.labels());
    node.set("base", pullRequest.base());
    node.set("head", pullRequest.head());
    node.set("requestedReviewers", pullRequest.requestedReviewers());
    node.put("comments", pullRequest.comments());
    node.put("commits", pullRequest.commits());
    node.put("changedFiles", pullRequest.changedFiles());
    node.put("additions", pullRequest.additions());
    node.put("deletions", pullRequest.deletions());
    node.put("draft", pullRequest.draft());
    node.put("merged", pullRequest.merged());
    node.put("createdAt", pullRequest.createdAt());
    node.put("updatedAt", pullRequest.updatedAt());
    return write(node);
  }

  public String buildSnapshotJson(GitHubApiClient.GitHubBranch branch) {
    ObjectNode node = objectMapper.createObjectNode();
    node.put("isDefaultBranch", branch.isDefault());
    node.put("aheadBy", branch.aheadBy());
    node.put("behindBy", branch.behindBy());
    node.put("lastCommitSha", branch.lastCommitSha());
    node.put("lastCommitMessage", branch.lastCommitMessage());
    node.put("lastCommitAt", branch.lastCommitAt());
    return write(node);
  }

  public String buildSnapshotJson(GitHubApiClient.GitHubCommit commit) {
    ObjectNode node = objectMapper.createObjectNode();
    node.put("message", commit.message());
    node.set("author", commit.author());
    node.set("committer", commit.committer());
    node.put("additions", commit.additions());
    node.put("deletions", commit.deletions());
    node.put("changedFiles", commit.changedFiles());
    node.put("committedAt", commit.committedAt());
    return write(node);
  }

  public String mapIssueStatus(String state) {
    return "open".equalsIgnoreCase(state) ? "open" : "closed";
  }

  public String mapPullRequestStatus(GitHubApiClient.GitHubPullRequest pullRequest) {
    if (pullRequest.merged()) {
      return "merged";
    }
    if (pullRequest.draft()) {
      return "draft";
    }
    return "open".equalsIgnoreCase(pullRequest.state()) ? "open" : "closed";
  }

  private String formatNumber(BoardCardGitHubLinkEntity link) {
    if (link.getGithubNumber() == null) {
      return null;
    }
    return "#" + link.getGithubNumber();
  }

  private String formatUpdatedAt(OffsetDateTime value) {
    if (value == null) {
      return null;
    }
    ApiDateTimeDto dto = dateTimeMapper.toDateTime(value);
    return dto == null ? null : dto.iso();
  }

  private String extractSnapshotUpdatedAt(GitHubLinkType linkType, JsonNode snapshot) {
    if (snapshot == null) {
      return null;
    }
    String updatedAt = snapshotText(snapshot, "updatedAt");
    if (StringUtils.hasText(updatedAt)) {
      return updatedAt;
    }
    return switch (linkType) {
      case COMMIT -> snapshotText(snapshot, "committedAt");
      case BRANCH -> snapshotText(snapshot, "lastCommitAt");
      case ISSUE, PULL_REQUEST -> null;
    };
  }

  private ObjectNode buildSearchSnapshot(GitHubApiClient.GitHubSearchItem item) {
    ObjectNode snapshot = objectMapper.createObjectNode();
    if (StringUtils.hasText(item.createdAt())) {
      snapshot.put("createdAt", item.createdAt());
    }
    if (item.type() == GitHubLinkType.COMMIT && StringUtils.hasText(item.updatedAt())) {
      snapshot.put("committedAt", item.updatedAt());
    }
    if (item.type() == GitHubLinkType.BRANCH && StringUtils.hasText(item.updatedAt())) {
      snapshot.put("lastCommitAt", item.updatedAt());
    }
    return snapshot;
  }

  private static String snapshotText(JsonNode snapshot, String field) {
    if (snapshot == null || !snapshot.hasNonNull(field)) {
      return null;
    }
    String value = snapshot.path(field).asText(null);
    return StringUtils.hasText(value) ? value : null;
  }

  private String extractBodyPreview(String snapshotJson) {
    if (!StringUtils.hasText(snapshotJson)) {
      return null;
    }
    try {
      String body = objectMapper.readTree(snapshotJson).path("body").asText(null);
      if (!StringUtils.hasText(body)) {
        body = objectMapper.readTree(snapshotJson).path("message").asText(null);
      }
      if (!StringUtils.hasText(body)) {
        return null;
      }
      String normalized = body.replace('\r', ' ').replace('\n', ' ').trim();
      return normalized.length() > 180 ? normalized.substring(0, 180) : normalized;
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  private JsonNode parseSnapshot(String snapshotJson) {
    if (!StringUtils.hasText(snapshotJson)) {
      return null;
    }
    try {
      return objectMapper.readTree(snapshotJson);
    } catch (JsonProcessingException exception) {
      return null;
    }
  }

  private String write(ObjectNode node) {
    try {
      return objectMapper.writeValueAsString(node);
    } catch (JsonProcessingException exception) {
      return "{}";
    }
  }

  public OffsetDateTime parseGitHubTimestamp(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    try {
      return OffsetDateTime.parse(value);
    } catch (DateTimeParseException exception) {
      return null;
    }
  }

  public record GitHubLinkedItemView(
      String id,
      String type,
      String repoFullName,
      String title,
      String url,
      String number,
      String status,
      String authorName,
      String authorAvatarUrl,
      String updatedAt,
      List<String> labelNames,
      String bodyPreview,
      Integer commentsCount,
      String baseBranch,
      String headBranch,
      GitHubDiffStatView diffStat,
      Boolean isDefaultBranch,
      Integer aheadBy,
      Integer behindBy,
      String lastCommitSha,
      String lastCommitMessage,
      String sha,
      String message,
      JsonNode snapshot,
      boolean unavailable,
      boolean completionAnchor,
      String linkedAt,
      String linkedByUserId
  ) {
  }

  public record GitHubDiffStatView(Integer additions, Integer deletions, Integer changedFiles) {
  }
}
