import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BoardViewModePopover from './BoardViewModePopover.jsx'

describe('BoardViewModePopover', () => {
  it('renders view mode options when open', () => {
    render(<BoardViewModePopover open viewMode="kanban" onClose={() => {}} />)

    expect(screen.getByRole('menu', { name: 'Modos de visualização do board' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'Kanban' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: 'Timeline' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('menuitemradio', { name: 'Bugtrack' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'Actions' })).toBeInTheDocument()
  })

  it('selects a view mode and closes', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onClose = vi.fn()

    render(
      <BoardViewModePopover
        open
        viewMode="kanban"
        onSelect={onSelect}
        onClose={onClose}
      />,
    )

    await user.click(screen.getByRole('menuitemradio', { name: 'Timeline' }))

    expect(onSelect).toHaveBeenCalledWith('timeline')
    expect(onClose).toHaveBeenCalled()
  })
})
