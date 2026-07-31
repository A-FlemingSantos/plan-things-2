package com.planthings.api.github;

import com.planthings.api.common.error.BadRequestException;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class GitHubUrlParser {

  private static final Pattern ISSUE_OR_PR = Pattern.compile(
      "https?://github\\.com/(?<owner>[^/]+)/(?<repo>[^/]+)/(?:issues|pull)/(?<number>\\d+)/?",
      Pattern.CASE_INSENSITIVE
  );
  private static final Pattern COMMIT = Pattern.compile(
      "https?://github\\.com/(?<owner>[^/]+)/(?<repo>[^/]+)/commit/(?<sha>[0-9a-f]{7,40})/?",
      Pattern.CASE_INSENSITIVE
  );
  private static final Pattern BRANCH = Pattern.compile(
      "https?://github\\.com/(?<owner>[^/]+)/(?<repo>[^/]+)/tree/(?<branch>.+?)/?",
      Pattern.CASE_INSENSITIVE
  );

  public ParsedGitHubUrl parse(String rawUrl) {
    if (!StringUtils.hasText(rawUrl)) {
      throw new BadRequestException("GITHUB_URL_INVALIDA", "Informe uma URL valida do GitHub.");
    }

    String url = rawUrl.trim();
    Matcher issueOrPr = ISSUE_OR_PR.matcher(url);
    if (issueOrPr.matches()) {
      String owner = issueOrPr.group("owner");
      String repo = issueOrPr.group("repo");
      int number = Integer.parseInt(issueOrPr.group("number"));
      GitHubLinkType type = url.toLowerCase(Locale.ROOT).contains("/pull/")
          ? GitHubLinkType.PULL_REQUEST
          : GitHubLinkType.ISSUE;
      return new ParsedGitHubUrl(type, owner, repo, owner + "/" + repo, number, null, null, url);
    }

    Matcher commit = COMMIT.matcher(url);
    if (commit.matches()) {
      return new ParsedGitHubUrl(
          GitHubLinkType.COMMIT,
          commit.group("owner"),
          commit.group("repo"),
          commit.group("owner") + "/" + commit.group("repo"),
          null,
          null,
          commit.group("sha"),
          url
      );
    }

    Matcher branch = BRANCH.matcher(url);
    if (branch.matches()) {
      String branchName = decodeRef(branch.group("branch"));
      return new ParsedGitHubUrl(
          GitHubLinkType.BRANCH,
          branch.group("owner"),
          branch.group("repo"),
          branch.group("owner") + "/" + branch.group("repo"),
          null,
          branchName,
          null,
          url
      );
    }

    throw new BadRequestException("GITHUB_URL_INVALIDA", "Nao reconhecemos esta URL do GitHub.");
  }

  private static String decodeRef(String ref) {
    return ref.replace("%2F", "/").replace("%2f", "/");
  }

  public record ParsedGitHubUrl(
      GitHubLinkType type,
      String owner,
      String repo,
      String repoFullName,
      Integer number,
      String ref,
      String sha,
      String url
  ) {
  }
}
