import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import useKanbanGitHubIntegration from './useKanbanGitHubIntegration.js'

const apiMock = vi.hoisted(() => ({ apiRequest: vi.fn() }))

vi.mock('../../../../../shared/api/apiClient.js', () => apiMock)

describe('useKanbanGitHubIntegration', () => {
  beforeEach(() => {
    apiMock.apiRequest.mockReset()
  })

  it('maps linked item snapshots for inline panel display', async () => {
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
          updatedAt: '2026-07-31T12:00:00Z',
          snapshot: {
            aheadBy: 2,
            behindBy: 0,
            lastCommitMessage: 'Latest work',
            lastCommitAt: '2025-01-15T10:00:00Z',
          },
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

    await waitFor(() => expect(result.current.linkedItems).toHaveLength(1))
    expect(result.current.linkedItems[0]).toMatchObject({
      aheadBy: 2,
      behindBy: 0,
      lastCommitMessage: 'Latest work',
      lastCommitAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    })
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
})
