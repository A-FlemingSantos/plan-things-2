import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CardModalGitHubPanel from './CardModalGitHubPanel.jsx'
import styles from './CardModalGitHubPanel.module.css'

const issue = {
  id: 'issue-1',
  type: 'issue',
  repoFullName: 'plan-things/app',
  title: 'Corrigir sincronização',
  number: '#42',
  status: 'open',
  url: 'https://github.com/plan-things/app/issues/42',
  body: '**Descrição** da issue',
  assignees: [{ login: 'arthur' }],
  milestone: { title: 'MVP' },
}

const commit = {
  id: 'commit-1',
  type: 'commit',
  repoFullName: 'plan-things/app',
  title: 'Implement GitHub panel',
  message: 'Implement GitHub panel\n\nDetails',
  sha: 'abcdef123456',
  url: 'https://github.com/plan-things/app/commit/abcdef123456',
  diffStat: { additions: 2, deletions: 1, changedFiles: 1 },
}

function buildSearchResults(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `issue-${index + 1}`,
    type: 'issue',
    repoFullName: 'plan-things/app',
    title: `Issue ${index + 1} with a longer title to verify natural row height`,
    number: `#${index + 1}`,
    status: 'open',
    url: `https://github.com/plan-things/app/issues/${index + 1}`,
    updatedAt: '2026-01-01T00:00:00Z',
    authorName: 'arthur',
  }))
}

describe('CardModalGitHubPanel', () => {
  it('renders the disconnected CTA for plan managers', async () => {
    const user = userEvent.setup()
    const onSetup = vi.fn()
    render(
      <CardModalGitHubPanel
        status="disconnected"
        isManager
        onOpenIntegrationSetup={onSetup}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Configurar integração' }))
    expect(onSetup).toHaveBeenCalledOnce()
  })

  it('renders issue metadata inline and unlinks it', async () => {
    const user = userEvent.setup()
    const onUnlink = vi.fn()
    render(
      <CardModalGitHubPanel
        status="ready"
        isManager
        linkedItems={[issue]}
        onUnlinkItem={onUnlink}
      />,
    )

    expect(screen.getByText('Descrição')).toBeInTheDocument()
    expect(screen.getByText('arthur')).toBeInTheDocument()
    expect(screen.getByText('MVP')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remover vínculo com Corrigir sincronização' }))
    expect(onUnlink).toHaveBeenCalledWith(issue)
  })

  it('shows commit summary inline with diff stats and external link', () => {
    render(
      <CardModalGitHubPanel
        status="ready"
        isManager
        linkedItems={[commit]}
      />,
    )

    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Abrir Implement GitHub panel no GitHub' })).toHaveAttribute(
      'href',
      commit.url,
    )
  })

  it('renders many search results inside the bounded results list container', () => {
    render(
      <CardModalGitHubPanel
        status="ready"
        isManager
        searchStatus="success"
        searchResults={buildSearchResults(12)}
        availableRepoFullNames={['plan-things/app']}
        searchRepoFilter="plan-things/app"
        onSearchTypeChange={() => {}}
        onSearchQueryChange={() => {}}
        onSearchRepoFilterChange={() => {}}
        onLinkItem={() => {}}
      />,
    )

    const list = screen.getByTestId('github-search-results-list')
    expect(list.className).toContain(styles.searchResultsList)
    expect(list.children).toHaveLength(12)
    expect(screen.getAllByRole('link', { name: /Abrir Issue \d+ with a longer title to verify natural row height no GitHub/ })).toHaveLength(12)
    list.childNodes.forEach((node) => {
      expect(node.className).toContain(styles.item)
    })
  })
})
