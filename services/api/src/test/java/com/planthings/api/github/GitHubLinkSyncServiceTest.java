package com.planthings.api.github;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.planthings.api.board.BoardCardEntity;
import com.planthings.api.board.BoardCardRepository;
import com.planthings.api.settings.GitHubIntegrationProperties;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GitHubLinkSyncServiceTest {

  @Mock
  private BoardCardGitHubLinkRepository linkRepository;
  @Mock
  private PlanGitHubRepoRepository planGitHubRepoRepository;
  @Mock
  private BoardCardRepository boardCardRepository;
  @Mock
  private GitHubAccessTokenService accessTokenService;
  @Mock
  private GitHubApiClient githubApiClient;
  @Mock
  private GitHubLinkMapper linkMapper;
  @Mock
  private GitHubAnchorService anchorService;
  @Mock
  private GitHubIntegrationProperties properties;

  @InjectMocks
  private GitHubLinkSyncService syncService;

  private final Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);

  @Test
  void shouldCompleteCardWhenMergedPullRequestAnchorIsSynced() {
    GitHubLinkSyncService service = new GitHubLinkSyncService(
        linkRepository,
        planGitHubRepoRepository,
        boardCardRepository,
        accessTokenService,
        githubApiClient,
        linkMapper,
        anchorService,
        properties,
        clock
    );

    UUID cardId = UUID.randomUUID();
    BoardCardGitHubLinkEntity anchor = new BoardCardGitHubLinkEntity();
    anchor.setCardId(cardId);
    anchor.setCompletionAnchor(true);
    anchor.setLinkType(GitHubLinkType.PULL_REQUEST);
    anchor.setStatus("merged");

    BoardCardEntity card = new BoardCardEntity();
    card.setCompleted(false);

    when(anchorService.shouldCompleteCard(anchor)).thenReturn(true);
    when(boardCardRepository.findById(cardId)).thenReturn(Optional.of(card));

    service.applyCompletionIfNeeded(anchor);

    assertTrue(card.getCompleted());
    verify(boardCardRepository).save(card);
  }

  @Test
  void shouldNeverUnsetCompletedCard() {
    GitHubLinkSyncService service = new GitHubLinkSyncService(
        linkRepository,
        planGitHubRepoRepository,
        boardCardRepository,
        accessTokenService,
        githubApiClient,
        linkMapper,
        anchorService,
        properties,
        clock
    );

    BoardCardGitHubLinkEntity anchor = new BoardCardGitHubLinkEntity();
    anchor.setCompletionAnchor(true);
    anchor.setLinkType(GitHubLinkType.ISSUE);
    anchor.setStatus("open");

    BoardCardEntity card = new BoardCardEntity();
    card.setCompleted(true);

    when(anchorService.shouldCompleteCard(anchor)).thenReturn(false);

    service.applyCompletionIfNeeded(anchor);

    assertTrue(card.getCompleted());
  }

  @Test
  void shouldNotCompleteCardForClosedPullRequestWithoutMerge() {
    BoardCardGitHubLinkEntity anchor = new BoardCardGitHubLinkEntity();
    anchor.setLinkType(GitHubLinkType.PULL_REQUEST);
    anchor.setStatus("closed");
    anchor.setCompletionAnchor(true);

    assertFalse(new GitHubAnchorService(linkRepository).shouldCompleteCard(anchor));
  }
}
