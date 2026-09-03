import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import BoardHeader from './BoardHeader.jsx'

vi.mock('../../../../shared/hooks/useAuthenticatedImageUrl.js', () => ({
  useAuthenticatedImageUrl: () => null,
}))

vi.mock('../../../../shared/components/AuthenticatedAvatar/AuthenticatedAvatar.jsx', () => ({
  default: ({ fallback, alt }) => <span data-testid="authenticated-avatar">{fallback ?? alt}</span>,
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

  it('dispatches menu actions without closing the popover', async () => {
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

    expect(onMoreOptionsAction).toHaveBeenCalledWith('export', expect.any(Object))
    expect(screen.getByRole('menu', { name: 'Mais opções do plano' })).toBeInTheDocument()
  })

  it('opens the cover picker anchor when Alterar capa is selected', async () => {
    const user = userEvent.setup()
    const onMoreOptionsAction = vi.fn()
    render(
      <BoardHeader
        planName="MVP Board"
        onMoreOptionsAction={onMoreOptionsAction}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    await user.click(screen.getByRole('menuitem', { name: /Alterar capa/i }))

    expect(onMoreOptionsAction).toHaveBeenCalledWith('cover', expect.objectContaining({
      top: expect.any(Number),
      left: expect.any(Number),
    }))
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

  it('opens the about plan panel when Sobre este plano is selected', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BoardHeader
          planName="MVP Board"
          plan={{ id: 'plan-1', name: 'MVP Board', description: 'Resumo do plano' }}
          members={[
            {
              id: 'user-1',
              name: 'Arthur Fleming Santos',
              email: 'flemingsantosa@example.com',
              role: 'ADMIN',
              initials: 'AF',
            },
          ]}
          currentUser={{ id: 'user-1' }}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    await user.click(screen.getByRole('menuitem', { name: /Sobre este plano/i }))

    expect(screen.getByRole('dialog', { name: 'Sobre este plano' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Descrição do plano' })).toHaveValue('Resumo do plano')
    expect(screen.queryByRole('menu', { name: 'Mais opções do plano' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Concluído' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('textbox', { name: 'Descrição do plano' }))
    expect(screen.getByRole('button', { name: 'Concluído' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('returns to the menu from the about plan panel', async () => {
    const user = userEvent.setup()
    render(<BoardHeader planName="MVP Board" plan={{ id: 'plan-1', name: 'MVP Board' }} />)

    await user.click(screen.getByRole('button', { name: 'Mais opções' }))
    await user.click(screen.getByRole('menuitem', { name: /Sobre este plano/i }))
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByRole('menu', { name: 'Mais opções do plano' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Sobre este plano' })).not.toBeInTheDocument()
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
