import { describe, expect, it } from 'vitest'
import {
  buildActivityFeedItems,
  buildGitHubLinkActivityItems,
} from './activityUtils.js'

describe('activityUtils github links', () => {
  const members = [{ id: 'user-1', fullName: 'Arthur Fleming' }]
  const getMemberName = (member) => member.fullName

  it('builds github link activity items sorted by linkedAt', () => {
    const items = buildGitHubLinkActivityItems({
      linkedItems: [
        {
          id: 'link-2',
          type: 'commit',
          title: 'Fix bug',
          sha: 'abc1234',
          url: 'https://github.com/acme/repo/commit/abc1234',
          repoFullName: 'acme/repo',
          linkedAt: '2026-01-02T00:00:00Z',
          linkedByUserId: 'user-1',
        },
        {
          id: 'link-1',
          type: 'issue',
          title: 'Bug report',
          number: '#12',
          url: 'https://github.com/acme/repo/issues/12',
          repoFullName: 'acme/repo',
          linkedAt: '2026-01-01T00:00:00Z',
          linkedByUserId: 'user-1',
        },
      ],
      members,
      getMemberName,
      currentUserName: 'Você',
    })

    expect(items).toHaveLength(2)
    expect(items.map((item) => item.id)).toEqual([
      'github-link-link-2',
      'github-link-link-1',
    ])
    expect(items[0].type).toBe('github_link')
    expect(items[0].actor).toBe('Arthur Fleming')
  })

  it('merges github link activity into the feed timeline', () => {
    const feed = buildActivityFeedItems({
      activityBase: { createdAt: '2025-12-31T00:00:00Z', memberIds: [] },
      comments: [],
      activityEvents: [],
      currentUserName: 'Arthur',
      createdAtLabel: '31 de dez.',
      members,
      getMemberName,
      githubLinkedItems: [{
        id: 'link-1',
        type: 'pull_request',
        title: 'Add feature',
        number: '#7',
        status: 'open',
        url: 'https://github.com/acme/repo/pull/7',
        repoFullName: 'acme/repo',
        linkedAt: '2026-01-15T00:00:00Z',
        linkedByUserId: 'user-1',
      }],
    })

    const githubItem = feed.find((item) => item.type === 'github_link')
    expect(githubItem).toBeTruthy()
    expect(githubItem.githubItem.title).toBe('Add feature')
    expect(feed.indexOf(githubItem)).toBeGreaterThan(0)
  })
})
