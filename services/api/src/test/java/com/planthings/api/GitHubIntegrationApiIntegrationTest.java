package com.planthings.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.planthings.api.github.GitHubApiClient;
import com.planthings.api.github.GitHubLinkType;
import com.planthings.api.github.GitHubOAuthClient;
import com.planthings.api.plans.PlanMemberEntity;
import com.planthings.api.plans.PlanMemberRepository;
import com.planthings.api.plans.PlanMemberRole;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "app.integrations.github.client-id=test-github-client",
    "app.integrations.github.client-secret=test-github-secret",
    "app.integrations.github.redirect-uri=http://localhost/api/settings/integrations/github/callback",
    "app.integrations.github.frontend-return-url=http://localhost/settings",
    "app.integrations.github.mobile-return-url=planthings://settings",
    "app.integrations.token-key-base64=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    "app.integrations.github.polling-interval-ms=60000"
})
class GitHubIntegrationApiIntegrationTest extends ApiIntegrationTestSupport {

  @Autowired
  private PlanMemberRepository planMemberRepository;

  @Test
  void shouldStartGitHubAuthorizationWithRepoScope() throws Exception {
    String token = registerAndGetToken("GitHub Owner", "github-owner@example.com", "12345678");

    JsonNode response = readJson(mockMvc.perform(post("/api/settings/integrations/github/start")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.authorizationUrl").isNotEmpty())
        .andReturn());

    String authorizationUrl = response.path("data").path("authorizationUrl").asText();
    assertEquals("test-github-client", queryParam(authorizationUrl, "client_id"));
    assertTrue(queryParam(authorizationUrl, "scope").contains("repo"));
    assertFalse(queryParam(authorizationUrl, "state").isBlank());
  }

  @Test
  void shouldConnectReportAndDisconnectGitHub() throws Exception {
    String token = registerAndGetToken("GitHub Owner", "github-owner@example.com", "12345678");
    String state = startGitHubAndReturnState(token);

    MvcResult callback = mockMvc.perform(get("/api/settings/integrations/github/callback")
            .queryParam("state", state)
            .queryParam("code", "github-owner"))
        .andExpect(status().isFound())
        .andReturn();

    assertEquals("connected", queryParam(callback.getResponse().getHeader("Location"), "github"));

    mockMvc.perform(get("/api/settings")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.integrations.github.connected").value(true))
        .andExpect(jsonPath("$.data.integrations.github.login").value("github-owner"));

    mockMvc.perform(delete("/api/settings/integrations/github")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.github.connected").value(false));
  }

  @Test
  void shouldRequireManagerToConnectPlanRepository() throws Exception {
    String ownerToken = registerAndGetToken("Plan Owner", "plan-owner@example.com", "12345678");
    connectGitHub(ownerToken);
    JsonNode plan = createPlan(ownerToken, "GitHub Plan");
    String planId = plan.path("plan").path("id").asText();

    String memberToken = registerAndGetToken("Plan Member", "plan-member@example.com", "12345678");
    mockMvc.perform(post("/api/plans/" + planId + "/github/repositories")
            .header("Authorization", "Bearer " + memberToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"fullName":"acme/repo"}
                """))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldLinkOnlyObjectsFromConnectedPlanRepository() throws Exception {
    String token = registerAndGetToken("Plan Owner", "plan-owner-link@example.com", "12345678");
    connectGitHub(token);
    JsonNode plan = createPlan(token, "GitHub Link Plan");
    String planId = plan.path("plan").path("id").asText();
    String columnId = createBoardColumn(token, planId, "Backlog");

    mockMvc.perform(post("/api/plans/" + planId + "/github/repositories")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"fullName":"acme/repo"}
                """))
        .andExpect(status().isOk());

    JsonNode card = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card GitHub"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String cardId = card.path("id").asText();

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"url":"https://github.com/other/repo/issues/1"}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("GITHUB_REPO_NAO_VINCULADO"));

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"url":"https://github.com/acme/repo/issues/1"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.completionAnchor").value(true));
  }

  @Test
  void shouldRequireManagerToMutateCardGitHubLinks() throws Exception {
    String ownerToken = registerAndGetToken("Plan Owner", "plan-owner-mutate@example.com", "12345678");
    connectGitHub(ownerToken);
    JsonNode plan = createPlan(ownerToken, "GitHub Mutation Plan");
    String planId = plan.path("plan").path("id").asText();
    String columnId = createBoardColumn(ownerToken, planId, "Doing");

    String memberToken = registerAndGetToken("Plan Member", "plan-member-mutate@example.com", "12345678");
    JsonNode memberSession = readJson(mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "email": "plan-member-mutate@example.com",
                  "password": "12345678"
                }
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    addMember(planId, memberSession.path("user").path("id").asText());

    mockMvc.perform(post("/api/plans/" + planId + "/github/repositories")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"fullName":"acme/repo"}
                """))
        .andExpect(status().isOk());

    JsonNode card = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card GitHub member mutation"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String cardId = card.path("id").asText();

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links")
            .header("Authorization", "Bearer " + memberToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"url":"https://github.com/acme/repo/issues/1"}
                """))
        .andExpect(status().isForbidden());

    JsonNode link = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links")
            .header("Authorization", "Bearer " + ownerToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"url":"https://github.com/acme/repo/issues/1"}
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    mockMvc.perform(delete("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links/" + link.path("id").asText())
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldSearchPlanGitHubObjectsWithEmptyQuery() throws Exception {
    FakeGitHubApiClient.reset();
    String token = registerAndGetToken("Plan Owner", "plan-owner-search@example.com", "12345678");
    connectGitHub(token);
    JsonNode plan = createPlan(token, "GitHub Search Plan");
    String planId = plan.path("plan").path("id").asText();

    mockMvc.perform(post("/api/plans/" + planId + "/github/repositories")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"fullName":"acme/repo"}
                """))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/plans/" + planId + "/github/objects")
            .queryParam("type", "issue")
            .queryParam("repo", "acme/repo")
            .queryParam("q", "")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].title").value("Recent issue"));

    assertEquals("repo:acme/repo is:issue", FakeGitHubApiClient.lastIssueSearchQuery);
  }

  @Test
  void shouldPromoteOldestEligibleAnchorOnRemoval() throws Exception {
    String token = registerAndGetToken("Plan Owner", "plan-owner-anchor@example.com", "12345678");
    connectGitHub(token);
    JsonNode plan = createPlan(token, "GitHub Anchor Plan");
    String planId = plan.path("plan").path("id").asText();
    String columnId = createBoardColumn(token, planId, "Doing");

    mockMvc.perform(post("/api/plans/" + planId + "/github/repositories")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"fullName":"acme/repo"}
                """))
        .andExpect(status().isOk());

    JsonNode card = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "columnId": "%s",
                  "title": "Card Anchor"
                }
                """.formatted(columnId)))
        .andExpect(status().isOk())
        .andReturn()).path("data");
    String cardId = card.path("id").asText();

    JsonNode firstLink = readJson(mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"url":"https://github.com/acme/repo/issues/1"}
                """))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    mockMvc.perform(post("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"url":"https://github.com/acme/repo/pull/2"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.completionAnchor").value(false));

    String firstLinkId = firstLink.path("id").asText();
    mockMvc.perform(delete("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links/" + firstLinkId)
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    JsonNode links = readJson(mockMvc.perform(get("/api/plans/" + planId + "/board/cards/" + cardId + "/github-links")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andReturn()).path("data");

    assertEquals(1, links.size());
    assertTrue(links.get(0).path("completionAnchor").asBoolean());
  }

  private void connectGitHub(String token) throws Exception {
    String state = startGitHubAndReturnState(token);
    mockMvc.perform(get("/api/settings/integrations/github/callback")
            .queryParam("state", state)
            .queryParam("code", "github-owner"))
        .andExpect(status().isFound());
  }

  private String startGitHubAndReturnState(String token) throws Exception {
    JsonNode start = readJson(mockMvc.perform(post("/api/settings/integrations/github/start")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andReturn());
    return queryParam(start.path("data").path("authorizationUrl").asText(), "state");
  }

  private void addMember(String planId, String userId) {
    PlanMemberEntity member = new PlanMemberEntity();
    member.setPlanId(UUID.fromString(planId));
    member.setUserId(UUID.fromString(userId));
    member.setRole(PlanMemberRole.MEMBER);
    planMemberRepository.save(member);
  }

  private String queryParam(String uri, String name) {
    String rawQuery = URI.create(uri).getRawQuery();
    if (rawQuery == null) {
      return "";
    }

    return Arrays.stream(rawQuery.split("&"))
        .map(part -> part.split("=", 2))
        .filter(parts -> parts.length == 2)
        .filter(parts -> URLDecoder.decode(parts[0], StandardCharsets.UTF_8).equals(name))
        .map(parts -> URLDecoder.decode(parts[1], StandardCharsets.UTF_8))
        .findFirst()
        .orElse("");
  }

  @TestConfiguration
  static class FakeGitHubClientsConfig {

    @Bean
    @Primary
    GitHubOAuthClient fakeGitHubOAuthClient() {
      return (authorizationCode, redirectUri) -> new GitHubOAuthClient.GitHubTokenResponse(
          "access-token-" + authorizationCode,
          "repo",
          "bearer"
      );
    }

    @Bean
    @Primary
    GitHubApiClient fakeGitHubApiClient() {
      return new FakeGitHubApiClient();
    }
  }

  static class FakeGitHubApiClient implements GitHubApiClient {

    static String lastIssueSearchQuery = "";
    static String lastBranchSearchQuery = "";
    static String lastCommitSearchQuery = "";

    static void reset() {
      lastIssueSearchQuery = "";
      lastBranchSearchQuery = "";
      lastCommitSearchQuery = "";
    }

    @Override
    public GitHubUser getAuthenticatedUser(String accessToken) {
      return new GitHubUser(1L, accessToken.replace("access-token-", ""), "https://avatars.example/github.png");
    }

    @Override
    public List<GitHubRepository> searchAccessibleRepositories(String accessToken, String query, int page, int perPage) {
      return List.of(new GitHubRepository(100L, "acme/repo", "Repo", false, "https://avatars.example/acme.png", "main"));
    }

    @Override
    public GitHubRepository getRepository(String accessToken, String owner, String repo) {
      return new GitHubRepository(100L, owner + "/" + repo, "Repo", false, "https://avatars.example/acme.png", "main");
    }

    @Override
    public GitHubIssue getIssue(String accessToken, String owner, String repo, int number) {
      return new GitHubIssue(
          10L,
          number,
          "Issue " + number,
          number == 1 ? "closed" : "open",
          "https://github.com/" + owner + "/" + repo + "/issues/" + number,
          "Body",
          null,
          null,
          null,
          null,
          0,
          "2025-12-31T00:00:00Z",
          "2026-01-01T00:00:00Z"
      );
    }

    @Override
    public GitHubPullRequest getPullRequest(String accessToken, String owner, String repo, int number) {
      return new GitHubPullRequest(
          20L,
          number,
          "PR " + number,
          number == 2 ? "closed" : "open",
          number == 2,
          false,
          "https://github.com/" + owner + "/" + repo + "/pull/" + number,
          "Body",
          null,
          null,
          null,
          null,
          null,
          0,
          1,
          1,
          1,
          1,
          "2025-12-31T00:00:00Z",
          "2026-01-01T00:00:00Z",
          null
      );
    }

    @Override
    public GitHubBranch getBranch(String accessToken, String owner, String repo, String branchName) {
      return new GitHubBranch(
          branchName,
          "https://github.com/" + owner + "/" + repo + "/tree/" + branchName,
          false,
          0,
          0,
          "sha",
          "message",
          "2026-01-01T00:00:00Z",
          null
      );
    }

    @Override
    public GitHubCommit getCommit(String accessToken, String owner, String repo, String sha) {
      return new GitHubCommit(sha, "https://github.com/" + owner + "/" + repo + "/commit/" + sha, "Commit", null, null, null, 1, 1, 1, "2026-01-01T00:00:00Z");
    }

    @Override
    public List<GitHubSearchItem> searchIssuesAndPullRequests(String accessToken, String query, int page, int perPage) {
      lastIssueSearchQuery = query;
      return List.of(new GitHubSearchItem(
          "issue-1",
          GitHubLinkType.ISSUE,
          "acme/repo",
          "Recent issue",
          "https://github.com/acme/repo/issues/1",
          "#1",
          "open",
          "github-owner",
          "https://avatars.example/github.png",
          "2025-12-31T00:00:00Z",
          "2026-01-01T00:00:00Z",
          List.of(),
          "Body",
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null
      ));
    }

    @Override
    public List<GitHubSearchItem> searchBranches(String accessToken, String owner, String repo, String query, int page, int perPage) {
      lastBranchSearchQuery = query == null ? "" : query;
      return List.of();
    }

    @Override
    public List<GitHubSearchItem> searchCommits(String accessToken, String owner, String repo, String query, int page, int perPage) {
      lastCommitSearchQuery = query == null ? "" : query;
      return List.of();
    }

    @Override
    public GitHubRefreshResult<GitHubIssue> refreshIssue(
        String accessToken,
        String owner,
        String repo,
        int number,
        String ifNoneMatch
    ) {
      return new GitHubRefreshResult<>(false, "\"issue-etag\"", getIssue(accessToken, owner, repo, number));
    }

    @Override
    public GitHubRefreshResult<GitHubPullRequest> refreshPullRequest(
        String accessToken,
        String owner,
        String repo,
        int number,
        String ifNoneMatch
    ) {
      return new GitHubRefreshResult<>(false, "\"pr-etag\"", getPullRequest(accessToken, owner, repo, number));
    }

    @Override
    public GitHubRefreshResult<GitHubBranch> refreshBranch(
        String accessToken,
        String owner,
        String repo,
        String branchName,
        String ifNoneMatch
    ) {
      return new GitHubRefreshResult<>(false, "\"branch-etag\"", getBranch(accessToken, owner, repo, branchName));
    }

    @Override
    public GitHubRefreshResult<GitHubCommit> refreshCommit(
        String accessToken,
        String owner,
        String repo,
        String sha,
        String ifNoneMatch
    ) {
      return new GitHubRefreshResult<>(false, "\"commit-etag\"", getCommit(accessToken, owner, repo, sha));
    }
  }
}
