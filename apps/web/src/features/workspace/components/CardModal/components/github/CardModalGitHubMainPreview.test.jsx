import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CardModalGitHubMainPreview from './CardModalGitHubMainPreview.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

const linkedIssue = {
  id: 'issue-1',
  type: 'issue',
  repoFullName: 'plan-things/app',
  title: 'Corrigir sincronização',
  number: '#42',
  status: 'open',
  url: 'https://github.com/plan-things/app/issues/42',
  body: '**Descrição** da issue',
}

describe('CardModalGitHubMainPreview', () => {
  it('renders linked GitHub items above the activity feed pattern', () => {
    render(
      <CardModalGitHubMainPreview
        styles={styles}
        cardId="card-1"
        isActivitySidebarOpen={false}
        githubIntegration={{
          status: 'ready',
          linkedItems: [linkedIssue],
          isManager: true,
          onUnlinkItem: vi.fn(),
          pendingUnlinkItemIds: [],
        }}
      />,
    )

    expect(screen.getByLabelText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Descrição')).toBeInTheDocument()
    expect(screen.getByText('Corrigir sincronização')).toBeInTheDocument()
  })

  it('hides when the activity sidebar is open', () => {
    render(
      <CardModalGitHubMainPreview
        styles={styles}
        cardId="card-1"
        isActivitySidebarOpen
        githubIntegration={{
          status: 'ready',
          linkedItems: [linkedIssue],
        }}
      />,
    )

    expect(screen.queryByLabelText('GitHub')).not.toBeInTheDocument()
  })

  it('hides when there are no linked items', () => {
    render(
      <CardModalGitHubMainPreview
        styles={styles}
        cardId="card-1"
        isActivitySidebarOpen={false}
        githubIntegration={{
          status: 'ready',
          linkedItems: [],
        }}
      />,
    )

    expect(screen.queryByLabelText('GitHub')).not.toBeInTheDocument()
  })
})
