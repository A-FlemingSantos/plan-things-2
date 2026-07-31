package com.planthings.api.github;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.planthings.api.auth.UserRepository;
import com.planthings.api.common.security.AuthenticatedUserService;
import com.planthings.api.common.time.BrazilDateTimeMapper;
import com.planthings.api.plans.PlanAccessService;
import com.planthings.api.settings.GitHubIntegrationService;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PlanGitHubServiceTest {

  @Mock
  private PlanAccessService planAccessService;
  @Mock
  private AuthenticatedUserService authenticatedUserService;
  @Mock
  private UserRepository userRepository;
  @Mock
  private PlanGitHubRepoRepository planGitHubRepoRepository;
  @Mock
  private BoardCardGitHubLinkRepository boardCardGitHubLinkRepository;
  @Mock
  private GitHubAccessTokenService accessTokenService;
  @Mock
  private GitHubApiClient githubApiClient;
  @Mock
  private GitHubIntegrationService githubIntegrationService;
  @Mock
  private GitHubLinkMapper linkMapper;
  @Mock
  private BrazilDateTimeMapper dateTimeMapper;
  @Mock
  private Clock clock;

  @InjectMocks
  private PlanGitHubService planGitHubService;

  @Test
  void shouldSearchIssuesWithEmptyQueryUsingRepoQualifierOnly() {
    UUID planId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    PlanGitHubRepoEntity repoEntity = new PlanGitHubRepoEntity();
    repoEntity.setConnectionUserId(userId);
    GitHubApiClient.GitHubSearchItem searchItem = new GitHubApiClient.GitHubSearchItem(
        "issue-1",
        GitHubLinkType.ISSUE,
        "acme/repo",
        "Recent issue",
        "https://github.com/acme/repo/issues/1",
        "#1",
        "open",
        null,
        null,
        null,
        List.of(),
        null,
        null,
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
    );
    GitHubLinkMapper.GitHubLinkedItemView mapped = new GitHubLinkMapper.GitHubLinkedItemView(
        "issue-1",
        "issue",
        "acme/repo",
        "Recent issue",
        "https://github.com/acme/repo/issues/1",
        "#1",
        "open",
        null,
        null,
        null,
        List.of(),
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        false,
        false
    );

    when(authenticatedUserService.requireUserId()).thenReturn(userId);
    when(planGitHubRepoRepository.findByPlanIdAndRepoFullNameIgnoreCaseAndRemovedAtIsNull(planId, "acme/repo"))
        .thenReturn(java.util.Optional.of(repoEntity));
    when(accessTokenService.requireActiveAccessToken(userId)).thenReturn("token");
    when(githubApiClient.searchIssuesAndPullRequests(eq("token"), eq("repo:acme/repo is:issue"), eq(1), eq(20)))
        .thenReturn(List.of(searchItem));
    when(linkMapper.toSearchItemView(searchItem)).thenReturn(mapped);

    List<GitHubLinkMapper.GitHubLinkedItemView> results = planGitHubService.searchObjects(planId, "issue", "acme/repo", "");

    assertEquals(1, results.size());
    assertEquals("Recent issue", results.get(0).title());
    verify(githubApiClient).searchIssuesAndPullRequests("token", "repo:acme/repo is:issue", 1, 20);
  }
}
