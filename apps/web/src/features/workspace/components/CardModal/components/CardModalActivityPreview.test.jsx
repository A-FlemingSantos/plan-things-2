import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CardModalActivityPreview from './CardModalActivityPreview.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

describe('CardModalActivityPreview', () => {
  it('shows the most recent activity items first', () => {
    render(
      <CardModalActivityPreview
        styles={styles}
        iconSize={16}
        iconStroke={2}
        cardId="card-1"
        isActivitySidebarOpen={false}
        isMutating={false}
        getCommentPresenter={() => ({
          name: 'Arthur',
          initials: 'AF',
          color: '#000',
          avatarUrl: null,
        })}
        activityFeedItems={[
          {
            id: 'older',
            type: 'history',
            sortAt: 1,
            actor: 'Arthur',
            text: 'criou esta tarefa · há 2 dias',
          },
          {
            id: 'newer',
            type: 'history',
            sortAt: 2,
            actor: 'Arthur',
            text: 'vinculou issue · há 1 hora',
          },
        ]}
      />,
    )

    const items = screen.getAllByText(/Arthur/)
    expect(items[0].closest('p')?.textContent).toContain('vinculou issue')
    expect(items[1].closest('p')?.textContent).toContain('criou esta tarefa')
  })

  it('hides when the activity sidebar is open', () => {
    render(
      <CardModalActivityPreview
        styles={styles}
        iconSize={16}
        iconStroke={2}
        cardId="card-1"
        isActivitySidebarOpen
        isMutating={false}
        getCommentPresenter={vi.fn()}
        activityFeedItems={[]}
      />,
    )

    expect(screen.queryByLabelText('Recentes')).not.toBeInTheDocument()
  })
})
