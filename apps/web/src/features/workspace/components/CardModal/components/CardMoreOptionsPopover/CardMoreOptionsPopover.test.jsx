import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CardMoreOptionsPopover from './CardMoreOptionsPopover.jsx'

describe('CardMoreOptionsPopover', () => {
  it('renders card menu items when open', () => {
    render(<CardMoreOptionsPopover open onClose={() => {}} />)

    expect(screen.getByRole('menu', { name: 'Mais opções do cartão' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Ingressar' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Mover' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Copiar' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Espelho' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Compartilhar' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Arquivar' })).toBeInTheDocument()
  })

  it('dispatches actions and closes', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onClose = vi.fn()

    render(<CardMoreOptionsPopover open onAction={onAction} onClose={onClose} />)

    await user.click(screen.getByRole('menuitem', { name: 'Copiar' }))

    expect(onAction).toHaveBeenCalledWith('copy')
    expect(onClose).toHaveBeenCalled()
  })

  it('shows unfollow label when already following', () => {
    render(<CardMoreOptionsPopover open isFollowing onClose={() => {}} />)

    expect(screen.getByRole('menuitem', { name: 'Deixar de seguir' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Seguir' })).not.toBeInTheDocument()
  })
})
