import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CardModalActivityGitHubLink from './CardModalActivityGitHubLink.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

describe('CardModalActivityGitHubLink', () => {
  it('renders a compact linked github item with attachment time', () => {
    render(
      <CardModalActivityGitHubLink
        styles={styles}
        actor="Arthur"
        item={{
          id: 'link-1',
          type: 'issue',
          title: 'Corrigir sync',
          number: '#42',
          status: 'open',
          repoFullName: 'acme/repo',
          url: 'https://github.com/acme/repo/issues/42',
          linkedAt: '2026-01-01T00:00:00Z',
        }}
      />,
    )

    expect(screen.getByText('Arthur')).toBeInTheDocument()
    expect(screen.getByText(/Corrigir sync/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Issue #42 Corrigir sync/ })).toHaveAttribute(
      'href',
      'https://github.com/acme/repo/issues/42',
    )
    expect(screen.getByText('acme/repo')).toBeInTheDocument()
  })
})
