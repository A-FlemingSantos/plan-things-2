package com.planthings.api.github;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GitHubAnchorServiceTest {

  @Mock
  private BoardCardGitHubLinkRepository linkRepository;

  @InjectMocks
  private GitHubAnchorService anchorService;

  @Test
  void shouldCompleteOnlyMergedPullRequestAnchor() {
    BoardCardGitHubLinkEntity anchor = anchor(GitHubLinkType.PULL_REQUEST, "merged");
    assertTrue(anchorService.shouldCompleteCard(anchor));
  }

  @Test
  void shouldNotCompleteClosedPullRequestWithoutMerge() {
    BoardCardGitHubLinkEntity anchor = anchor(GitHubLinkType.PULL_REQUEST, "closed");
    assertFalse(anchorService.shouldCompleteCard(anchor));
  }

  @Test
  void shouldCompleteClosedIssueAnchor() {
    BoardCardGitHubLinkEntity anchor = anchor(GitHubLinkType.ISSUE, "closed");
    assertTrue(anchorService.shouldCompleteCard(anchor));
  }

  @Test
  void shouldNotCompleteBranchOrCommitAnchors() {
    assertFalse(anchorService.shouldCompleteCard(anchor(GitHubLinkType.BRANCH, "open")));
    assertFalse(anchorService.shouldCompleteCard(anchor(GitHubLinkType.COMMIT, null)));
  }

  @Test
  void shouldPromoteOldestEligibleIssueOrPullRequest() {
    UUID cardId = UUID.randomUUID();
    BoardCardGitHubLinkEntity current = anchor(GitHubLinkType.ISSUE, "open");
    current.setCardId(cardId);
    current.setCompletionAnchor(true);

    BoardCardGitHubLinkEntity oldest = anchor(GitHubLinkType.PULL_REQUEST, "open");
    oldest.setCardId(cardId);

    when(linkRepository.findByCardIdAndCompletionAnchorTrue(cardId)).thenReturn(Optional.of(current));
    when(linkRepository.findByCardIdAndLinkTypeInOrderByCreatedAtAsc(
        cardId,
        java.util.List.of(GitHubLinkType.ISSUE, GitHubLinkType.PULL_REQUEST)
    )).thenReturn(java.util.List.of(oldest));

    anchorService.promoteNextAnchor(cardId);

    assertFalse(current.getCompletionAnchor());
    assertTrue(oldest.getCompletionAnchor());
  }

  private static BoardCardGitHubLinkEntity anchor(GitHubLinkType type, String status) {
    BoardCardGitHubLinkEntity link = new BoardCardGitHubLinkEntity();
    link.setLinkType(type);
    link.setStatus(status);
    link.setUnavailable(false);
    link.setCompletionAnchor(true);
    return link;
  }
}
