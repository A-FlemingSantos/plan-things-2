import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BoardHeader from './BoardHeader.jsx'

vi.mock('../../../../shared/hooks/useAuthenticatedImageUrl.js', () => ({
  useAuthenticatedImageUrl: () => null,
}))

describe('BoardHeader more options popover', () => {
  it('opens the more options menu from the trailing action', async () => {
    const user = userEvent.setup()
    render(<BoardHeader planName="MVP Board" />)

    const trigger = screen.getByRole('button', { name: 'Mais opções' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: 'Mais opções do plano' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Sobre este plano/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Etiquetas/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Fechar plano/i })).toBeInTheDocument()
  })

  it('dispatches menu actions and closes the popover', async () => {
    const user = userEvent.setup()
    const onMoreOptionsAction = vi.fn()
    render(
      <BoardHeader
        planName="MVP Board"
        onMoreOptionsAction={onMoreOptionsAction}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    await user.click(screen.getByRole('menuitem', { name: /Exportar plano/i }))

    expect(onMoreOptionsAction).toHaveBeenCalledWith('export')
    expect(screen.queryByRole('menu', { name: 'Mais opções do plano' })).not.toBeInTheDocument()
  })

  it('shows a cover preview instead of an icon for Alterar capa', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <BoardHeader
        planName="MVP Board"
        plan={{
          name: 'MVP Board',
          cover: '#2abb7f',
          coverThemeId: 'neon',
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    const coverItem = screen.getByRole('menuitem', { name: /Alterar capa/i })
    expect(coverItem.querySelector('[aria-hidden="true"]')).toBeTruthy()
    expect(container.querySelector('[class*="themeneon"]')).toBeTruthy()
  })

  it('shows the GitHub badge when integrations are connected', async () => {
    const user = userEvent.setup()
    render(
      <BoardHeader
        planName="MVP Board"
        githubIntegration={{
          connectedRepos: [{ fullName: 'acme/repo' }],
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    expect(screen.getByRole('menuitem', { name: /Integrações/i })).toBeInTheDocument()
  })
})
