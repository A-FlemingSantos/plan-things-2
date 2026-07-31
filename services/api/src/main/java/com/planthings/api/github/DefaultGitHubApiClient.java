package com.planthings.api.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.planthings.api.common.error.BadRequestException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class DefaultGitHubApiClient implements GitHubApiClient {

  private final GitHubRestExecutor restExecutor;
  private final ObjectMapper objectMapper;

  public DefaultGitHubApiClient(GitHubRestExecutor restExecutor, ObjectMapper objectMapper) {
    this.restExecutor = restExecutor;
    this.objectMapper = objectMapper;
  }

  @Override
  public GitHubUser getAuthenticatedUser(String accessToken) {
    JsonNode node = restExecutor.getJson(accessToken, "/user");
    return new GitHubUser(
        node.path("id").asLong(),
        node.path("login").asText(""),
        node.path("avatar_url").asText(null)
    );
  }

  @Override
  public List<GitHubRepository> searchAccessibleRepositories(String accessToken, String query, int page, int perPage) {
    String path = UriComponentsBuilder.fromPath("/user/repos")
        .queryParam("affiliation", "owner,collaborator,organization_member")
        .queryParam("sort", "updated")
        .queryParam("direction", "desc")
        .queryParam("per_page", perPage)
        .queryParam("page", page)
        .build()
        .encode()
        .toUriString();

    List<JsonNode> nodes = restExecutor.getAllPages(accessToken, path);
    String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
    List<GitHubRepository> repositories = new ArrayList<>();
    for (JsonNode item : nodes) {
      GitHubRepository repository = mapRepository(item);
      if (StringUtils.hasText(normalizedQuery)
          && !repository.fullName().toLowerCase(Locale.ROOT).contains(normalizedQuery)) {
        continue;
      }
      repositories.add(repository);
    }
    return repositories;
  }

  @Override
  public GitHubRepository getRepository(String accessToken, String owner, String repo) {
    return mapRepository(restExecutor.getJson(accessToken, repoPath(owner, repo)));
  }

  @Override
  public GitHubIssue getIssue(String accessToken, String owner, String repo, int number) {
    JsonNode node = restExecutor.getJson(accessToken, repoPath(owner, repo) + "/issues/" + number);
    if (node.hasNonNull("pull_request")) {
      throw new BadRequestException("GITHUB_OBJETO_INVALIDO", "A URL informada aponta para um pull request, nao para uma issue.");
    }
    return mapIssue(node);
  }

  @Override
  public GitHubPullRequest getPullRequest(String accessToken, String owner, String repo, int number) {
    return mapPullRequest(restExecutor.getJson(accessToken, repoPath(owner, repo) + "/pulls/" + number));
  }

  @Override
  public GitHubBranch getBranch(String accessToken, String owner, String repo, String branchName) {
    JsonNode repoNode = restExecutor.getJson(accessToken, repoPath(owner, repo));
    String defaultBranch = repoNode.path("default_branch").asText("");
    JsonNode node = restExecutor.getJson(accessToken, repoPath(owner, repo) + "/branches/" + encodeRef(branchName));
    JsonNode compare = restExecutor.getJson(
        accessToken,
        repoPath(owner, repo) + "/compare/" + encodeRef(defaultBranch) + "..." + encodeRef(branchName)
    );
    JsonNode commit = node.path("commit");
    return new GitHubBranch(
        node.path("name").asText(""),
        "https://github.com/" + owner + "/" + repo + "/tree/" + node.path("name").asText(""),
        defaultBranch.equals(node.path("name").asText("")),
        compare.path("ahead_by").asInt(0),
        compare.path("behind_by").asInt(0),
        commit.path("sha").asText(""),
        commit.path("commit").path("message").asText(""),
        objectMapper.createArrayNode()
    );
  }

  @Override
  public GitHubCommit getCommit(String accessToken, String owner, String repo, String sha) {
    return mapCommit(restExecutor.getJson(accessToken, repoPath(owner, repo) + "/commits/" + sha));
  }

  @Override
  public List<GitHubSearchItem> searchIssuesAndPullRequests(String accessToken, String query, int page, int perPage) {
    String path = UriComponentsBuilder.fromPath("/search/issues")
        .queryParam("q", query)
        .queryParam("sort", "updated")
        .queryParam("order", "desc")
        .queryParam("per_page", perPage)
        .queryParam("page", page)
        .build()
        .encode()
        .toUriString();
    JsonNode response = restExecutor.getJson(accessToken, path);
    List<GitHubSearchItem> items = new ArrayList<>();
    for (JsonNode item : response.path("items")) {
      items.add(mapIssueSearchItem(item));
    }
    return items;
  }

  @Override
  public List<GitHubSearchItem> searchBranches(String accessToken, String owner, String repo, String query, int page, int perPage) {
    String path = repoPath(owner, repo) + "/branches?per_page=" + perPage + "&page=" + page;
    JsonNode branches = restExecutor.getJson(accessToken, path);
    List<GitHubSearchItem> items = new ArrayList<>();
    String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
    for (JsonNode item : branches) {
      String name = item.path("name").asText("");
      if (StringUtils.hasText(normalizedQuery) && !name.toLowerCase(Locale.ROOT).contains(normalizedQuery)) {
        continue;
      }
      JsonNode commit = item.path("commit");
      items.add(new GitHubSearchItem(
          owner + "/" + repo + ":branch:" + name,
          GitHubLinkType.BRANCH,
          owner + "/" + repo,
          name,
          "https://github.com/" + owner + "/" + repo + "/tree/" + name,
          null,
          "open",
          null,
          null,
          commit.path("commit").path("author").path("date").asText(null),
          List.of(),
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          commit.path("sha").asText(null),
          commit.path("commit").path("message").asText(null),
          null,
          null
      ));
    }
    return items;
  }

  @Override
  public List<GitHubSearchItem> searchCommits(String accessToken, String owner, String repo, String query, int page, int perPage) {
    String normalizedQuery = query == null ? "" : query.trim();
    String repoFullName = owner + "/" + repo;
    if (!StringUtils.hasText(normalizedQuery)) {
      String path = repoPath(owner, repo) + "/commits?per_page=" + perPage + "&page=" + page;
      JsonNode commits = restExecutor.getJson(accessToken, path);
      List<GitHubSearchItem> items = new ArrayList<>();
      for (JsonNode item : commits) {
        items.add(mapCommitSearchItem(item, repoFullName));
      }
      return items;
    }

    String path = UriComponentsBuilder.fromPath("/search/commits")
        .queryParam("q", normalizedQuery + " repo:" + repoFullName)
        .queryParam("sort", "committer-date")
        .queryParam("order", "desc")
        .queryParam("per_page", perPage)
        .queryParam("page", page)
        .build()
        .encode()
        .toUriString();
    JsonNode response = restExecutor.getJson(accessToken, path);
    List<GitHubSearchItem> items = new ArrayList<>();
    for (JsonNode item : response.path("items")) {
      items.add(mapCommitSearchItem(item, repoFullName));
    }
    return items;
  }

  @Override
  public GitHubCommitDiff getCommitDiff(String accessToken, String owner, String repo, String sha) {
    JsonNode node = restExecutor.getJson(accessToken, repoPath(owner, repo) + "/commits/" + sha);
    StringBuilder patchPreview = new StringBuilder();
    for (JsonNode file : node.path("files")) {
      if (patchPreview.length() > 8000) {
        break;
      }
      String patch = file.path("patch").asText("");
      if (StringUtils.hasText(patch)) {
        String filename = file.path("filename").asText("file");
        String previousFilename = file.path("previous_filename").asText(filename);
        patchPreview
            .append("diff --git a/").append(previousFilename).append(" b/").append(filename).append('\n')
            .append("--- a/").append(previousFilename).append('\n')
            .append("+++ b/").append(filename).append('\n')
            .append(patch).append('\n');
      }
    }
    return new GitHubCommitDiff(
        node.path("stats").path("additions").asInt(0),
        node.path("stats").path("deletions").asInt(0),
        node.path("files").size(),
        patchPreview.length() > 8000 ? patchPreview.substring(0, 8000) : patchPreview.toString()
    );
  }

  @Override
  public GitHubRefreshResult<GitHubIssue> refreshIssue(
      String accessToken,
      String owner,
      String repo,
      int number,
      String ifNoneMatch
  ) {
    GitHubRestExecutor.GitHubHttpResponse response = restExecutor.get(
        accessToken,
        repoPath(owner, repo) + "/issues/" + number,
        ifNoneMatch
    );
    if (response.notModified()) {
      return new GitHubRefreshResult<>(true, response.etag(), null);
    }
    JsonNode node = response.requireBody();
    if (node.hasNonNull("pull_request")) {
      throw new BadRequestException("GITHUB_OBJETO_INVALIDO", "A URL informada aponta para um pull request, nao para uma issue.");
    }
    return new GitHubRefreshResult<>(false, response.etag(), mapIssue(node));
  }

  @Override
  public GitHubRefreshResult<GitHubPullRequest> refreshPullRequest(
      String accessToken,
      String owner,
      String repo,
      int number,
      String ifNoneMatch
  ) {
    GitHubRestExecutor.GitHubHttpResponse response = restExecutor.get(
        accessToken,
        repoPath(owner, repo) + "/pulls/" + number,
        ifNoneMatch
    );
    if (response.notModified()) {
      return new GitHubRefreshResult<>(true, response.etag(), null);
    }
    return new GitHubRefreshResult<>(false, response.etag(), mapPullRequest(response.requireBody()));
  }

  @Override
  public GitHubRefreshResult<GitHubBranch> refreshBranch(
      String accessToken,
      String owner,
      String repo,
      String branchName,
      String ifNoneMatch
  ) {
    GitHubRestExecutor.GitHubHttpResponse response = restExecutor.get(
        accessToken,
        repoPath(owner, repo) + "/branches/" + encodeRef(branchName),
        ifNoneMatch
    );
    if (response.notModified()) {
      return new GitHubRefreshResult<>(true, response.etag(), null);
    }
    return new GitHubRefreshResult<>(false, response.etag(), getBranch(accessToken, owner, repo, branchName));
  }

  @Override
  public GitHubRefreshResult<GitHubCommit> refreshCommit(
      String accessToken,
      String owner,
      String repo,
      String sha,
      String ifNoneMatch
  ) {
    GitHubRestExecutor.GitHubHttpResponse response = restExecutor.get(
        accessToken,
        repoPath(owner, repo) + "/commits/" + sha,
        ifNoneMatch
    );
    if (response.notModified()) {
      return new GitHubRefreshResult<>(true, response.etag(), null);
    }
    return new GitHubRefreshResult<>(false, response.etag(), mapCommit(response.requireBody()));
  }

  @Override
  public JsonNode fetchPullRequestDetails(String accessToken, String owner, String repo, int number) {
    return fetchPullRequestDetailsPage(accessToken, owner, repo, number, 1, 30);
  }

  @Override
  public JsonNode fetchPullRequestDetailsPage(
      String accessToken,
      String owner,
      String repo,
      int number,
      int page,
      int perPage
  ) {
    GitHubPullRequest pullRequest = getPullRequest(accessToken, owner, repo, number);
    String headSha = pullRequest.head().path("sha").asText("");
    ObjectNode details = objectMapper.createObjectNode();
    details.set("pullRequest", objectMapper.valueToTree(pullRequest));
    JsonNode commits = restExecutor.getJson(
        accessToken,
        repoPath(owner, repo) + "/pulls/" + number + "/commits?per_page=" + perPage + "&page=" + page
    );
    details.set("commits", commits);
    details.set("reviews", restExecutor.getJson(accessToken, repoPath(owner, repo) + "/pulls/" + number + "/reviews?per_page=100"));
    details.put("page", page);
    details.put("hasMore", commits.isArray() && commits.size() == perPage);
    if (StringUtils.hasText(headSha)) {
      details.set("combinedStatus", restExecutor.getJson(accessToken, repoPath(owner, repo) + "/commits/" + headSha + "/status"));
      details.set("checkRuns", restExecutor.getJson(accessToken, repoPath(owner, repo) + "/commits/" + headSha + "/check-runs?per_page=100"));
    }
    return details;
  }

  @Override
  public JsonNode fetchBranchDetails(
      String accessToken,
      String owner,
      String repo,
      String branchName,
      int page,
      int perPage
  ) {
    GitHubBranch branch = getBranch(accessToken, owner, repo, branchName);
    JsonNode commits = restExecutor.getJson(
        accessToken,
        repoPath(owner, repo) + "/commits?sha=" + encodeRef(branchName) + "&per_page=" + perPage + "&page=" + page
    );
    ObjectNode details = objectMapper.valueToTree(branch);
    details.set("commits", commits);
    details.put("page", page);
    details.put("hasMore", commits.isArray() && commits.size() == perPage);
    return details;
  }

  private GitHubRepository mapRepository(JsonNode node) {
    return new GitHubRepository(
        node.path("id").asLong(),
        node.path("full_name").asText(""),
        node.path("description").asText(null),
        node.path("private").asBoolean(false),
        node.path("owner").path("avatar_url").asText(null),
        node.path("default_branch").asText(null)
    );
  }

  private GitHubIssue mapIssue(JsonNode node) {
    return new GitHubIssue(
        node.path("id").asLong(),
        node.path("number").asInt(),
        node.path("title").asText(""),
        node.path("state").asText(""),
        node.path("html_url").asText(""),
        node.path("body").asText(null),
        node.path("labels"),
        node.path("assignees"),
        node.path("milestone"),
        node.path("user"),
        node.path("comments").asInt(0),
        node.path("created_at").asText(null),
        node.path("updated_at").asText(null)
    );
  }

  private GitHubPullRequest mapPullRequest(JsonNode node) {
    return new GitHubPullRequest(
        node.path("id").asLong(),
        node.path("number").asInt(),
        node.path("title").asText(""),
        node.path("state").asText(""),
        node.path("merged").asBoolean(false),
        node.path("draft").asBoolean(false),
        node.path("html_url").asText(""),
        node.path("body").asText(null),
        node.path("labels"),
        node.path("user"),
        node.path("base"),
        node.path("head"),
        node.path("requested_reviewers"),
        node.path("comments").asInt(0),
        node.path("commits").asInt(0),
        node.path("changed_files").asInt(0),
        node.path("additions").asInt(0),
        node.path("deletions").asInt(0),
        node.path("updated_at").asText(null),
        node.path("statuses_url")
    );
  }

  private GitHubCommit mapCommit(JsonNode node) {
    return new GitHubCommit(
        node.path("sha").asText(""),
        node.path("html_url").asText(""),
        node.path("commit").path("message").asText(""),
        node.path("commit").path("author"),
        node.path("commit").path("committer"),
        node.path("files"),
        node.path("stats").path("additions").asInt(0),
        node.path("stats").path("deletions").asInt(0),
        node.path("files").size(),
        node.path("commit").path("committer").path("date").asText(null)
    );
  }

  private GitHubSearchItem mapIssueSearchItem(JsonNode node) {
    GitHubLinkType type = node.hasNonNull("pull_request") ? GitHubLinkType.PULL_REQUEST : GitHubLinkType.ISSUE;
    boolean merged = type == GitHubLinkType.PULL_REQUEST && node.hasNonNull("pull_request")
        && !node.path("pull_request").path("merged_at").isNull();
    String status = mapStatus(type, node.path("state").asText(""), merged);
    return new GitHubSearchItem(
        node.path("id").asText(""),
        type,
        extractRepoFullName(node.path("repository_url").asText("")),
        node.path("title").asText(""),
        node.path("html_url").asText(""),
        "#" + node.path("number").asInt(),
        status,
        node.path("user").path("login").asText(null),
        node.path("user").path("avatar_url").asText(null),
        node.path("updated_at").asText(null),
        labelNames(node.path("labels")),
        preview(node.path("body").asText(null)),
        node.path("comments").asInt(0),
        type == GitHubLinkType.PULL_REQUEST ? node.path("base").path("ref").asText(null) : null,
        type == GitHubLinkType.PULL_REQUEST ? node.path("head").path("ref").asText(null) : null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    );
  }

  private GitHubSearchItem mapCommitSearchItem(JsonNode node, String repoFullName) {
    String sha = node.path("sha").asText("");
    return new GitHubSearchItem(
        sha,
        GitHubLinkType.COMMIT,
        repoFullName,
        node.path("commit").path("message").asText(""),
        node.path("html_url").asText(""),
        null,
        null,
        node.path("commit").path("author").path("name").asText(null),
        node.path("author").path("avatar_url").asText(null),
        node.path("commit").path("author").path("date").asText(null),
        List.of(),
        preview(node.path("commit").path("message").asText(null)),
        null,
        null,
        null,
        new GitHubCommitDiff(
            node.path("stats").path("additions").asInt(0),
            node.path("stats").path("deletions").asInt(0),
            node.path("files").size(),
            null
        ),
        null,
        null,
        null,
        sha,
        node.path("commit").path("message").asText(""),
        sha,
        node.path("commit").path("message").asText("")
    );
  }

  private static String mapStatus(GitHubLinkType type, String state, boolean merged) {
    if (type == GitHubLinkType.PULL_REQUEST) {
      if (merged) {
        return "merged";
      }
      return "open".equalsIgnoreCase(state) ? "open" : "closed";
    }
    return "open".equalsIgnoreCase(state) ? "open" : "closed";
  }

  private static List<String> labelNames(JsonNode labels) {
    List<String> names = new ArrayList<>();
    if (labels == null || !labels.isArray()) {
      return names;
    }
    Iterator<JsonNode> iterator = labels.elements();
    while (iterator.hasNext()) {
      names.add(iterator.next().path("name").asText(""));
    }
    return names;
  }

  private static String preview(String body) {
    if (!StringUtils.hasText(body)) {
      return null;
    }
    String normalized = body.replace('\r', ' ').replace('\n', ' ').trim();
    return normalized.length() > 180 ? normalized.substring(0, 180) : normalized;
  }

  private static String extractRepoFullName(String repositoryUrl) {
    if (!StringUtils.hasText(repositoryUrl)) {
      return "";
    }
    int reposIndex = repositoryUrl.indexOf("/repos/");
    if (reposIndex < 0) {
      return "";
    }
    return repositoryUrl.substring(reposIndex + "/repos/".length());
  }

  private static String repoPath(String owner, String repo) {
    return "/repos/" + owner + "/" + repo;
  }

  private static String encodeRef(String ref) {
    return ref.replace("/", "%2F");
  }
}
