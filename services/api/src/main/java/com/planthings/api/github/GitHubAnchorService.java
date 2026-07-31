package com.planthings.api.github;

import com.planthings.api.plans.PlanAccessService;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GitHubAnchorService {

  private final BoardCardGitHubLinkRepository linkRepository;

  public GitHubAnchorService(BoardCardGitHubLinkRepository linkRepository) {
    this.linkRepository = linkRepository;
  }

  @Transactional
  public void assignAnchorOnCreate(BoardCardGitHubLinkEntity link) {
    if (!link.getLinkType().isCompletionEligible()) {
      link.setCompletionAnchor(false);
      return;
    }

    boolean hasAnchor = linkRepository.findByCardIdAndCompletionAnchorTrue(link.getCardId()).isPresent();
    link.setCompletionAnchor(!hasAnchor);
  }

  @Transactional
  public void promoteNextAnchor(UUID cardId) {
    linkRepository.findByCardIdAndCompletionAnchorTrue(cardId).ifPresent(current -> {
      current.setCompletionAnchor(false);
      linkRepository.save(current);
    });

    linkRepository.findByCardIdAndLinkTypeInOrderByCreatedAtAsc(
            cardId,
            List.of(GitHubLinkType.ISSUE, GitHubLinkType.PULL_REQUEST)
        ).stream()
        .filter(link -> !Boolean.TRUE.equals(link.getUnavailable()))
        .min(Comparator.comparing(BoardCardGitHubLinkEntity::getCreatedAt))
        .ifPresent(next -> {
          next.setCompletionAnchor(true);
          linkRepository.save(next);
        });
  }

  public boolean shouldCompleteCard(BoardCardGitHubLinkEntity anchor) {
    if (anchor == null || Boolean.TRUE.equals(anchor.getUnavailable())) {
      return false;
    }
    if (anchor.getLinkType() == GitHubLinkType.ISSUE) {
      return "closed".equalsIgnoreCase(anchor.getStatus());
    }
    if (anchor.getLinkType() == GitHubLinkType.PULL_REQUEST) {
      return "merged".equalsIgnoreCase(anchor.getStatus());
    }
    return false;
  }
}
