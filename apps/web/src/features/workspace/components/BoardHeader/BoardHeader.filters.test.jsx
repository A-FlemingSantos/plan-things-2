import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import BoardHeader from './BoardHeader.jsx'
import { BOARD_FILTER_DEFAULTS } from '../BoardFilterPopover/boardFilterDefaults.js'

vi.mock('../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx', () => ({
  default: ({ fallback, alt }) => <span aria-hidden="true">{fallback ?? alt}</span>,
}))

function StatefulBoardHeader(props) {
  const [boardFilter, setBoardFilter] = useState(BOARD_FILTER_DEFAULTS)
  return (
    <BoardHeader
      {...props}
      boardFilter={boardFilter}
      onBoardFilterChange={setBoardFilter}
    />
  )
}

describe('BoardHeader filter popover', () => {
  it('opens the filter menu from the funnel action', async () => {
    const user = userEvent.setup()
    render(
      <BoardHeader
        planName="MVP Board"
        labels={[
          { id: 'l1', text: 'Feature', color: '#2abb7f' },
        ]}
        members={[
          { id: 'm1', name: 'Arthur', initials: 'AF', color: '#2363eb' },
        ]}
        currentUser={{ id: 'u1', fullName: 'Arthur', initials: 'AF', color: '#2363eb' }}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Filtros' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'Filtro' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Palavra-chave' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Membros' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Etiquetas' })).toBeInTheDocument()
    expect(screen.getByText('Cartões atribuídos a mim')).toBeInTheDocument()
  })

  it('updates filter state and highlights the trigger when active', async () => {
    const user = userEvent.setup()
    render(<StatefulBoardHeader planName="MVP Board" />)

    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.type(screen.getByPlaceholderText('Insira uma palavra-chave...'), 'bug')

    expect(screen.getByPlaceholderText('Insira uma palavra-chave...')).toHaveValue('bug')
    expect(screen.getByRole('button', { name: 'Filtros' })).toHaveClass(/iconButtonActive/)
  })

  it('keeps the filter body scroll position when toggling an option', async () => {
    const user = userEvent.setup()
    render(
      <BoardHeader
        planName="MVP Board"
        labels={[
          { id: 'l1', text: 'Design', color: '#f5a623' },
          { id: 'l2', text: 'Engenharia', color: '#2363eb' },
          { id: 'l3', text: 'Marketing', color: '#e2483d' },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Filtros' }))

    const viewport = document.querySelector('[data-custom-scroll-viewport]')
    expect(viewport).not.toBeNull()

    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 120 })
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: 480 })
    viewport.scrollTop = 180

    await user.click(screen.getByRole('checkbox', { name: /A ser entregue em um mês/i }))

    expect(viewport.scrollTop).toBe(180)
  })

  it('selects the match mode from the footer dropdown', async () => {
    const user = userEvent.setup()
    const onBoardFilterChange = vi.fn()
    render(
      <BoardHeader
        planName="MVP Board"
        boardFilter={BOARD_FILTER_DEFAULTS}
        onBoardFilterChange={onBoardFilterChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.click(screen.getByRole('button', { name: /Qualquer correspondência/i }))
    await user.click(screen.getByRole('option', { name: /Correspondência exata/i }))

    expect(onBoardFilterChange).toHaveBeenCalledWith({
      ...BOARD_FILTER_DEFAULTS,
      matchMode: 'all',
    })
  })
})
