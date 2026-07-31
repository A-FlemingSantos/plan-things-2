package com.planthings.api.github;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DefaultGitHubApiClientTest {

  @Mock
  private GitHubRestExecutor restExecutor;

  private DefaultGitHubApiClient client;
  private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper();
    client = new DefaultGitHubApiClient(restExecutor, objectMapper);
  }

  @Test
  void shouldListRecentBranchesFromSinglePage() throws Exception {
    ArrayNode branches = objectMapper.createArrayNode();
    for (int index = 0; index < 35; index += 1) {
      branches.addObject()
          .put("name", "branch-" + index)
          .set("commit", objectMapper.createObjectNode()
              .put("sha", "sha-" + index)
              .set("commit", objectMapper.createObjectNode()
                  .put("message", "Commit " + index)
                  .set("author", objectMapper.createObjectNode().put("date", "2026-01-01T00:00:00Z"))));
    }
    when(restExecutor.getJson(eq("token"), eq("/repos/acme/repo/branches?per_page=30&page=1")))
        .thenReturn(branches);

    List<GitHubApiClient.GitHubSearchItem> items = client.searchBranches("token", "acme", "repo", "", 1, 30);

    assertEquals(35, items.size());
    verify(restExecutor, never()).getAllPages(anyString(), anyString());
    verify(restExecutor).getJson("token", "/repos/acme/repo/branches?per_page=30&page=1");
  }

  @Test
  void shouldFilterBranchesByQueryOnSinglePage() throws Exception {
    ArrayNode branches = objectMapper.createArrayNode();
    branches.addObject()
        .put("name", "feature/login")
        .set("commit", objectMapper.createObjectNode()
            .put("sha", "sha-1")
            .set("commit", objectMapper.createObjectNode()
                .put("message", "Login")
                .set("author", objectMapper.createObjectNode().put("date", "2026-01-01T00:00:00Z"))));
    branches.addObject()
        .put("name", "main")
        .set("commit", objectMapper.createObjectNode()
            .put("sha", "sha-2")
            .set("commit", objectMapper.createObjectNode()
                .put("message", "Main")
                .set("author", objectMapper.createObjectNode().put("date", "2026-01-01T00:00:00Z"))));
    when(restExecutor.getJson(eq("token"), eq("/repos/acme/repo/branches?per_page=30&page=1")))
        .thenReturn(branches);

    List<GitHubApiClient.GitHubSearchItem> items = client.searchBranches("token", "acme", "repo", "login", 1, 30);

    assertEquals(1, items.size());
    assertEquals("feature/login", items.get(0).title());
  }

  @Test
  void shouldListRecentCommitsWithoutSearchQuery() throws Exception {
    ArrayNode commits = objectMapper.createArrayNode();
    commits.addObject()
        .put("sha", "abc123")
        .put("html_url", "https://github.com/acme/repo/commit/abc123")
        .set("commit", objectMapper.createObjectNode()
            .put("message", "Initial commit")
            .set("author", objectMapper.createObjectNode()
                .put("name", "Arthur")
                .put("date", "2026-01-01T00:00:00Z")));
    when(restExecutor.getJson(eq("token"), eq("/repos/acme/repo/commits?per_page=20&page=1")))
        .thenReturn(commits);

    List<GitHubApiClient.GitHubSearchItem> items = client.searchCommits("token", "acme", "repo", "", 1, 20);

    assertEquals(1, items.size());
    assertEquals(GitHubLinkType.COMMIT, items.get(0).type());
    assertEquals("abc123", items.get(0).sha());
    verify(restExecutor).getJson("token", "/repos/acme/repo/commits?per_page=20&page=1");
    verify(restExecutor, never()).getJson(eq("token"), org.mockito.ArgumentMatchers.contains("/search/commits"));
  }

  @Test
  void shouldSearchCommitsWhenQueryIsPresent() throws Exception {
    var response = objectMapper.createObjectNode();
    ArrayNode items = objectMapper.createArrayNode();
    var commitItem = items.addObject();
    commitItem
        .put("sha", "def456")
        .put("html_url", "https://github.com/acme/repo/commit/def456");
    commitItem.set("stats", objectMapper.createObjectNode().put("additions", 1).put("deletions", 0));
    commitItem.set("files", objectMapper.createArrayNode());
    commitItem.set("commit", objectMapper.createObjectNode()
        .put("message", "Fix login")
        .set("author", objectMapper.createObjectNode()
            .put("name", "Arthur")
            .put("date", "2026-01-02T00:00:00Z")));
    response.set("items", items);
    when(restExecutor.getJson(eq("token"), contains("/search/commits")))
        .thenReturn(response);

    List<GitHubApiClient.GitHubSearchItem> results = client.searchCommits("token", "acme", "repo", "login", 1, 20);

    assertEquals(1, results.size());
    assertEquals("def456", results.get(0).sha());
    assertTrue(results.get(0).title().contains("Fix login"));
    verify(restExecutor, never()).getJson(eq("token"), eq("/repos/acme/repo/commits?per_page=20&page=1"));
  }
}