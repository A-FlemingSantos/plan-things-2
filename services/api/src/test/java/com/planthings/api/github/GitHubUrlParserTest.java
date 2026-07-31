package com.planthings.api.github;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class GitHubUrlParserTest {

  private final GitHubUrlParser parser = new GitHubUrlParser();

  @Test
  void shouldParseIssueUrl() {
    GitHubUrlParser.ParsedGitHubUrl parsed = parser.parse("https://github.com/acme/repo/issues/42");
    assertEquals(GitHubLinkType.ISSUE, parsed.type());
    assertEquals("acme/repo", parsed.repoFullName());
    assertEquals(42, parsed.number());
  }

  @Test
  void shouldParsePullRequestUrl() {
    GitHubUrlParser.ParsedGitHubUrl parsed = parser.parse("https://github.com/acme/repo/pull/7");
    assertEquals(GitHubLinkType.PULL_REQUEST, parsed.type());
    assertEquals(7, parsed.number());
  }

  @Test
  void shouldParseBranchUrl() {
    GitHubUrlParser.ParsedGitHubUrl parsed = parser.parse("https://github.com/acme/repo/tree/feature/login");
    assertEquals(GitHubLinkType.BRANCH, parsed.type());
    assertEquals("feature/login", parsed.ref());
  }

  @Test
  void shouldParseCommitUrl() {
    GitHubUrlParser.ParsedGitHubUrl parsed = parser.parse("https://github.com/acme/repo/commit/abc1234567890abcd");
    assertEquals(GitHubLinkType.COMMIT, parsed.type());
    assertEquals("abc1234567890abcd", parsed.sha());
  }
}
