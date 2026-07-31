import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useKanbanGitHubIntegration from './useKanbanGitHubIntegration.js'

const apiMock = vi.hoisted(() => ({ apiRequest: vi.fn() }))
const diff2htmlMock = vi.hoisted(() => ({ html: vi.fn(() => '<div>diff</div>') }))

vi.mock('../../../../../shared/api/apiClient.js', () => apiMock)
vi.mock('diff2html', () => diff2htmlMock)
vi.mock('diff2html/bundles/css/diff2html.min.css', () => ({}))

describe('useKanbanGitHubIntegration', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
    diff2htmlMock.html.mockClear()
  })

  it('loads and paginates detailed branch commits', async () => {
    apiMock.apiRequest.mockImplementation((path) => {
      if (path === '/api/settings') {
        return Promise.resolve({ integrations: { github: { connected: true, login: 'arthur', scopes: ['repo'] } } })
      }
      if (path === '/api/plans/plan-1/github/repositories') {
        return Promise.resolve([{ id: 'repo-link-1', fullName: 'acme/repo', connectionStatus: 'connected' }])
      }
      if (path === '/api/plans/plan-1/board/cards/card-1/github-links') {
        return Promise.resolve([{
          id: 'link-1',
          type: 'branch',
          repoFullName: 'acme/repo',
          title: 'feature/github',
          url: 'https://github.com/acme/repo/tree/feature/github',
        }])
      }
      if (path.includes('/github-links/link-1/details?page=1')) {
        return Promise.resolve({
          details: {
            aheadBy: 2,
            behindBy: 0,
            page: 1,
            hasMore: true,
            commits: [{ sha: 'aaaaaaa1', commit: { message: 'First', author: { name: 'Arthur' } } }],
          },
        })
      }
      if (path.includes('/github-links/link-1/details?page=2')) {
        return Promise.resolve({
          details: {
            page: 2,
            hasMore: false,
            commits: [{ sha: 'bbbbbbb2', commit: { message: 'Second', author: { name: 'Bruna' } } }],
          },
        })
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`))
    })

    const { result } = renderHook(() => useKanbanGitHubIntegration({
      planId: 'plan-1',
      cardId: 'card-1',
      accessToken: 'token',
      enabled: true,
      isManager: true,
    }))

    await waitFor(() => expect(result.current.linkedItems).toHaveLength(1))
    await act(async () => {
      await result.current.loadItemDetails(result.current.linkedItems[0])
    })
    expect(result.current.linkedItems[0]).toMatchObject({
      aheadBy: 2,
      detailsPage: 1,
      hasMoreDetails: true,
    })
    expect(result.current.linkedItems[0].commits[0]).toMatchObject({ sha: 'aaaaaaa1', message: 'First' })

    act(() => {
      result.current.loadMoreItemDetails(result.current.linkedItems[0])
    })
    await waitFor(() => expect(result.current.linkedItems[0].commits).toHaveLength(2))
    expect(result.current.linkedItems[0].hasMoreDetails).toBe(false)
  })

  it('loads object search results immediately when a plan repository is selected', async () => {
    let objectsRequestCount = 0

    apiMock.apiRequest.mockImplementation((path) => {
      if (path === '/api/settings') {
        return Promise.resolve({ integrations: { github: { connected: true, login: 'arthur', scopes: ['repo'] } } })
      }
      if (path === '/api/plans/plan-1/github/repositories') {
        return Promise.resolve([{ id: 'repo-link-1', fullName: 'acme/repo', connectionStatus: 'connected' }])
      }
      if (path === '/api/plans/plan-1/board/cards/card-1/github-links') {
        return Promise.resolve([])
      }
      if (path.startsWith('/api/plans/plan-1/github/objects?')) {
        objectsRequestCount += 1
        expect(path).toContain('type=issue')
        expect(path).toContain('repo=acme%2Frepo')
        expect(path).toMatch(/[?&]q=(&|$)/)
        return Promise.resolve([{
          id: 'issue-1',
          type: 'issue',
          repoFullName: 'acme/repo',
          title: 'Recent issue',
          url: 'https://github.com/acme/repo/issues/1',
          number: 1,
        }])
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`))
    })

    const { result } = renderHook(() => useKanbanGitHubIntegration({
      planId: 'plan-1',
      cardId: 'card-1',
      accessToken: 'token',
      enabled: true,
      isManager: true,
    }))

    await waitFor(() => expect(result.current.status).toBe('ready'))
    await waitFor(() => expect(result.current.searchRepoFilter).toBe('acme/repo'))
    await waitFor(() => expect(result.current.searchStatus).toBe('success'))

    expect(objectsRequestCount).toBe(1)
    expect(result.current.searchResults).toHaveLength(1)
    expect(result.current.searchResults[0]).toMatchObject({
      title: 'Recent issue',
      repoFullName: 'acme/repo',
    })
  })

  it('loads commit diffs for search results via plan endpoint and linked commits via link endpoint', async () => {
    const requestedPaths = []
    apiMock.apiRequest.mockImplementation((path) => {
      requestedPaths.push(path)
      if (path === '/api/settings') {
        return Promise.resolve({ integrations: { github: { connected: true, login: 'arthur', scopes: ['repo'] } } })
      }
      if (path === '/api/plans/plan-1/github/repositories') {
        return Promise.resolve([{ id: 'repo-link-1', fullName: 'acme/repo', connectionStatus: 'connected' }])
      }
      if (path === '/api/plans/plan-1/board/cards/card-1/github-links') {
        return Promise.resolve([{
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          type: 'commit',
          repoFullName: 'acme/repo',
          title: 'Linked commit',
          sha: '1111111111111111111111111111111111111111',
          url: 'https://github.com/acme/repo/commit/1111111111111111111111111111111111111111',
        }])
      }
      if (path.startsWith('/api/plans/plan-1/github/objects?')) {
        return Promise.resolve([])
      }
      if (path.includes('/github/commit-diff?')) {
        return Promise.resolve({ additions: 2, deletions: 1, changedFiles: 1, patch: 'diff --git a/a b/a\n' })
      }
      if (path.includes('/github-links/') && path.endsWith('/diff')) {
        return Promise.resolve({ additions: 3, deletions: 0, changedFiles: 1, patch: 'diff --git a/b b/b\n' })
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`))
    })

    const { result } = renderHook(() => useKanbanGitHubIntegration({
      planId: 'plan-1',
      cardId: 'card-1',
      accessToken: 'token',
      enabled: true,
      isManager: true,
    }))

    await waitFor(() => expect(result.current.linkedItems).toHaveLength(1))

    await act(async () => {
      await result.current.loadCommitDiff({
        id: '56ac34d46c0ad31c324fca767ebfce60bf2fb29b',
        type: 'commit',
        repoFullName: 'acme/repo',
        sha: '56ac34d46c0ad31c324fca767ebfce60bf2fb29b',
        title: 'Unlinked commit',
      })
    })

    expect(requestedPaths.some((path) => (
      path === '/api/plans/plan-1/github/commit-diff?repo=acme%2Frepo&sha=56ac34d46c0ad31c324fca767ebfce60bf2fb29b'
    ))).toBe(true)
    expect(result.current.commitDiffStateById['56ac34d46c0ad31c324fca767ebfce60bf2fb29b']).toBe('loaded')

    await act(async () => {
      await result.current.loadCommitDiff(result.current.linkedItems[0])
    })

    expect(requestedPaths.some((path) => (
      path === '/api/plans/plan-1/board/cards/card-1/github-links/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/diff'
    ))).toBe(true)
    expect(result.current.commitDiffStateById['aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee']).toBe('loaded')
  })
})
