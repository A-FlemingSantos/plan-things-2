import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../../../../shared/api/apiClient.js'

const EMPTY_CONNECTION = {
  connected: false,
  login: null,
  avatarUrl: null,
  scopes: [],
  lastError: null,
}

function normalizeConnection(source) {
  return {
    ...EMPTY_CONNECTION,
    ...(source ?? {}),
    connected: Boolean(source?.connected),
    scopes: Array.isArray(source?.scopes) ? source.scopes : [],
  }
}

function normalizeRepo(repo) {
  const fullName = repo?.fullName ?? repo?.full_name ?? ''
  return {
    ...repo,
    id: String(repo?.id ?? fullName),
    fullName,
    defaultBranch: repo?.defaultBranch ?? repo?.default_branch ?? null,
    isPrivate: Boolean(repo?.isPrivate ?? repo?.private),
    ownerAvatarUrl: repo?.ownerAvatarUrl ?? repo?.owner?.avatar_url ?? null,
    connectionStatus: repo?.connectionStatus ?? (repo?.lastError ? 'error' : 'connected'),
  }
}

function normalizeLinkType(type) {
  if (type === 'pr') return 'pull_request'
  return type
}

function normalizeGitHubItem(item) {
  const snapshot = item?.snapshot && typeof item.snapshot === 'object' ? item.snapshot : {}
  const source = { ...item, ...snapshot }
  const type = normalizeLinkType(source.type)
  const number = source.number == null
    ? undefined
    : String(source.number).startsWith('#') ? String(source.number) : `#${source.number}`

  const labelNames = source.labelNames?.length
    ? source.labelNames
    : source.labels?.map((label) => label?.name ?? label).filter(Boolean) ?? []

  const diffStat = source.diffStat ?? (
    source.additions != null || source.deletions != null || source.changedFiles != null
      ? {
          additions: source.additions ?? 0,
          deletions: source.deletions ?? 0,
          changedFiles: source.changedFiles ?? 0,
        }
      : undefined
  )

  const createdAt = snapshot.createdAt ?? snapshot.created_at ?? item.createdAt ?? item.created_at
  const committedAt = snapshot.committedAt ?? snapshot.committed_at
  const lastCommitAt = snapshot.lastCommitAt ?? snapshot.last_commit_at
  const updatedAt = snapshot.updatedAt ?? snapshot.updated_at
    ?? committedAt
    ?? lastCommitAt
    ?? item.updatedAt
    ?? item.updated_at

  return {
    ...source,
    id: String(source.id ?? source.htmlUrl ?? source.url ?? `${type}:${source.repoFullName}:${number ?? source.ref ?? source.sha}`),
    type,
    repoFullName: source.repoFullName ?? source.repo ?? source.repositoryFullName ?? '',
    title: source.title ?? source.name ?? source.ref ?? source.sha ?? 'Item do GitHub',
    url: source.url ?? source.htmlUrl ?? source.html_url ?? '#',
    number,
    status: source.status ?? source.state,
    createdAt,
    updatedAt,
    committedAt,
    lastCommitAt,
    authorName: source.authorName ?? source.author?.login ?? source.author?.name ?? source.user?.login,
    authorAvatarUrl: source.authorAvatarUrl ?? source.author?.avatar_url ?? source.user?.avatar_url,
    labelNames,
    body: source.body,
    bodyPreview: source.bodyPreview ?? source.body,
    sha: source.sha ?? source.lastCommitSha,
    message: source.message ?? source.commit?.message ?? source.lastCommitMessage,
    assignees: source.assignees,
    milestone: source.milestone,
    baseBranch: source.baseBranch ?? source.base?.ref,
    headBranch: source.headBranch ?? source.head?.ref,
    commentsCount: source.commentsCount ?? source.comments,
    aheadBy: source.aheadBy,
    behindBy: source.behindBy,
    lastCommitSha: source.lastCommitSha,
    lastCommitMessage: source.lastCommitMessage,
    diffStat,
    linkedAt: item.linkedAt ?? item.linked_at,
    linkedByUserId: item.linkedByUserId ?? item.linked_by_user_id ?? null,
  }
}

function errorMessage(error, fallback) {
  return error?.message ?? fallback
}

export default function useKanbanGitHubIntegration({
  planId,
  cardId,
  accessToken,
  enabled,
  isManager,
  onBoardRefresh,
}) {
  const [connection, setConnection] = useState(EMPTY_CONNECTION)
  const [connectedRepos, setConnectedRepos] = useState([])
  const [linkedItems, setLinkedItems] = useState([])
  const [status, setStatus] = useState(enabled ? 'loading' : 'disconnected')
  const [statusMessage, setStatusMessage] = useState('')
  const [repoSearchQuery, setRepoSearchQuery] = useState('')
  const [repoSearchStatus, setRepoSearchStatus] = useState('idle')
  const [repoSearchResults, setRepoSearchResults] = useState([])
  const [repoSearchError, setRepoSearchError] = useState('')
  const [pendingConnectRepoIds, setPendingConnectRepoIds] = useState([])
  const [pendingRemoveRepoIds, setPendingRemoveRepoIds] = useState([])
  const [urlInputValue, setUrlInputValue] = useState('')
  const [urlSubmitStatus, setUrlSubmitStatus] = useState('idle')
  const [urlSubmitError, setUrlSubmitError] = useState('')
  const [searchType, setSearchType] = useState('issue')
  const [searchRepoFilter, setSearchRepoFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchStatus, setSearchStatus] = useState('idle')
  const [searchResults, setSearchResults] = useState([])
  const [searchError, setSearchError] = useState('')
  const [pendingLinkItemIds, setPendingLinkItemIds] = useState([])
  const [pendingUnlinkItemIds, setPendingUnlinkItemIds] = useState([])

  const request = useCallback((path, options = {}) => {
    if (!accessToken) throw new Error('Entre com uma conta real para usar o GitHub.')
    return apiRequest(path, { ...options, token: accessToken })
  }, [accessToken])

  const loadPlanIntegration = useCallback(async () => {
    if (!enabled || !planId || !accessToken) {
      setConnection(EMPTY_CONNECTION)
      setConnectedRepos([])
      setStatus('disconnected')
      return
    }

    setStatus('loading')
    setStatusMessage('')
    try {
      const [settings, repos] = await Promise.all([
        request('/api/settings'),
        request(`/api/plans/${planId}/github/repositories`),
      ])
      const github = normalizeConnection(settings?.integrations?.github)
      setConnection(github)
      setConnectedRepos((Array.isArray(repos) ? repos : repos?.repositories ?? []).map(normalizeRepo))
      setStatus(github.connected ? 'ready' : 'disconnected')
    } catch (error) {
      setStatus('error')
      setStatusMessage(errorMessage(error, 'Não foi possível carregar a integração GitHub.'))
    }
  }, [accessToken, enabled, planId, request])

  const loadCardLinks = useCallback(async () => {
    if (!enabled || !planId || !cardId || !accessToken) {
      setLinkedItems([])
      return
    }
    try {
      const response = await request(`/api/plans/${planId}/board/cards/${cardId}/github-links`)
      setLinkedItems((Array.isArray(response) ? response : response?.links ?? []).map(normalizeGitHubItem))
    } catch (error) {
      setStatus('error')
      setStatusMessage(errorMessage(error, 'Não foi possível carregar os itens GitHub deste cartão.'))
    }
  }, [accessToken, cardId, enabled, planId, request])

  useEffect(() => {
    void loadPlanIntegration()
  }, [loadPlanIntegration])

  useEffect(() => {
    void loadCardLinks()
  }, [loadCardLinks])

  const startOAuth = useCallback(async (redirectTo) => {
    const response = await request('/api/settings/integrations/github/start', {
      method: 'POST',
      body: { client: 'web', ...(redirectTo ? { redirectTo } : {}) },
    })
    window.location.assign(response.authorizationUrl)
  }, [request])

  const searchRepositories = useCallback(async (query = repoSearchQuery) => {
    if (!isManager) return
    setRepoSearchStatus('loading')
    setRepoSearchError('')
    try {
      const response = await request(`/api/settings/integrations/github/repositories?q=${encodeURIComponent(query.trim())}`)
      setRepoSearchResults((Array.isArray(response) ? response : response?.repositories ?? []).map(normalizeRepo))
      setRepoSearchStatus('success')
    } catch (error) {
      setRepoSearchStatus('error')
      setRepoSearchError(errorMessage(error, 'Não foi possível buscar repositórios.'))
    }
  }, [isManager, repoSearchQuery, request])

  useEffect(() => {
    if (!repoSearchQuery.trim() || status !== 'ready' || !isManager) {
      setRepoSearchStatus('idle')
      setRepoSearchResults([])
      return undefined
    }
    const timer = window.setTimeout(() => {
      void searchRepositories(repoSearchQuery)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [isManager, repoSearchQuery, searchRepositories, status])

  const connectRepo = useCallback(async (repo) => {
    setPendingConnectRepoIds((ids) => [...ids, repo.id])
    try {
      const response = await request(`/api/plans/${planId}/github/repositories`, {
        method: 'POST',
        body: {
          githubId: repo.id,
          fullName: repo.fullName,
          defaultBranch: repo.defaultBranch,
          private: repo.isPrivate,
          ownerAvatarUrl: repo.ownerAvatarUrl,
        },
      })
      const linkedRepo = normalizeRepo(response?.repository ?? response)
      setConnectedRepos((repos) => [...repos.filter((item) => item.fullName !== linkedRepo.fullName), linkedRepo])
    } finally {
      setPendingConnectRepoIds((ids) => ids.filter((id) => id !== repo.id))
    }
  }, [planId, request])

  const removeRepo = useCallback(async (repo) => {
    setPendingRemoveRepoIds((ids) => [...ids, repo.id])
    try {
      await request(`/api/plans/${planId}/github/repositories/${repo.id}`, { method: 'DELETE' })
      setConnectedRepos((repos) => repos.filter((item) => item.id !== repo.id))
      if (searchRepoFilter === repo.fullName) setSearchRepoFilter('')
    } finally {
      setPendingRemoveRepoIds((ids) => ids.filter((id) => id !== repo.id))
    }
  }, [planId, request, searchRepoFilter])

  const refreshLinksAndBoard = useCallback(async () => {
    await loadCardLinks()
    await onBoardRefresh?.()
  }, [loadCardLinks, onBoardRefresh])

  const linkByUrl = useCallback(async () => {
    if (!urlInputValue.trim()) return
    setUrlSubmitStatus('loading')
    setUrlSubmitError('')
    try {
      await request(`/api/plans/${planId}/board/cards/${cardId}/github-links`, {
        method: 'POST',
        body: { url: urlInputValue.trim() },
      })
      setUrlInputValue('')
      setUrlSubmitStatus('idle')
      await refreshLinksAndBoard()
    } catch (error) {
      setUrlSubmitStatus('error')
      setUrlSubmitError(errorMessage(error, 'Não foi possível vincular esta URL.'))
    }
  }, [cardId, planId, refreshLinksAndBoard, request, urlInputValue])

  const searchObjects = useCallback(async (query = searchQuery) => {
    if (!searchRepoFilter) {
      setSearchStatus('error')
      setSearchError('Selecione um repositório do Plano.')
      return
    }
    setSearchStatus('loading')
    setSearchError('')
    try {
      const params = new URLSearchParams({
        type: searchType === 'pull_request' ? 'pr' : searchType,
        repo: searchRepoFilter,
        q: query.trim(),
      })
      const response = await request(`/api/plans/${planId}/github/objects?${params}`)
      setSearchResults((Array.isArray(response) ? response : response?.items ?? []).map(normalizeGitHubItem))
      setSearchStatus('success')
    } catch (error) {
      setSearchStatus('error')
      setSearchError(errorMessage(error, 'Não foi possível buscar no GitHub.'))
    }
  }, [planId, request, searchQuery, searchRepoFilter, searchType])

  useEffect(() => {
    if (!searchRepoFilter || status !== 'ready') {
      setSearchStatus('idle')
      setSearchResults([])
      return undefined
    }
    const delay = searchQuery.trim() ? 300 : 0
    const timer = window.setTimeout(() => {
      void searchObjects(searchQuery)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [searchObjects, searchQuery, searchRepoFilter, searchType, status])

  const linkItem = useCallback(async (item) => {
    setPendingLinkItemIds((ids) => [...ids, item.id])
    try {
      await request(`/api/plans/${planId}/board/cards/${cardId}/github-links`, {
        method: 'POST',
        body: {
          type: item.type === 'pull_request' ? 'pr' : item.type,
          repo: item.repoFullName,
          number: item.number ? Number(String(item.number).replace('#', '')) : null,
          ref: item.type === 'branch' ? item.title : null,
          sha: item.sha ?? null,
          url: item.url,
        },
      })
      await refreshLinksAndBoard()
    } finally {
      setPendingLinkItemIds((ids) => ids.filter((id) => id !== item.id))
    }
  }, [cardId, planId, refreshLinksAndBoard, request])

  const unlinkItem = useCallback(async (item) => {
    setPendingUnlinkItemIds((ids) => [...ids, item.id])
    try {
      await request(`/api/plans/${planId}/board/cards/${cardId}/github-links/${item.id}`, { method: 'DELETE' })
      await refreshLinksAndBoard()
    } finally {
      setPendingUnlinkItemIds((ids) => ids.filter((id) => id !== item.id))
    }
  }, [cardId, planId, refreshLinksAndBoard, request])

  const availableRepoFullNames = useMemo(
    () => connectedRepos.map((repo) => repo.fullName).filter(Boolean),
    [connectedRepos],
  )

  useEffect(() => {
    if (!searchRepoFilter && availableRepoFullNames.length === 1) {
      setSearchRepoFilter(availableRepoFullNames[0])
    }
  }, [availableRepoFullNames, searchRepoFilter])

  return {
    connection,
    connectedRepos,
    linkedItems,
    status,
    statusMessage,
    reload: async () => Promise.all([loadPlanIntegration(), loadCardLinks()]),
    startOAuth,
    repoSearchQuery,
    setRepoSearchQuery,
    repoSearchStatus,
    repoSearchResults,
    repoSearchError,
    connectRepo,
    removeRepo,
    pendingConnectRepoIds,
    pendingRemoveRepoIds,
    urlInputValue,
    setUrlInputValue,
    linkByUrl,
    urlSubmitStatus,
    urlSubmitError,
    searchType,
    setSearchType,
    searchRepoFilter,
    setSearchRepoFilter,
    availableRepoFullNames,
    searchQuery,
    setSearchQuery,
    searchStatus,
    searchResults,
    searchError,
    linkItem,
    unlinkItem,
    pendingLinkItemIds,
    pendingUnlinkItemIds,
  }
}
