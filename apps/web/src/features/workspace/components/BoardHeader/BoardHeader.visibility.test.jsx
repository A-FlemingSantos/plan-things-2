import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import BoardHeader from './BoardHeader.jsx'

describe('BoardHeader visibility popover', () => {
  it('opens the visibility menu from the globe action', async () => {
    const user = userEvent.setup()
    render(
      <BoardHeader
        planName="MVP Board"
        workspaceName="Área de Trabalho (Pessoal)"
        plan={{ role: 'ADMIN', visibility: 'PRIVATE' }}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Alterar visibilidade' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'Alterar visibilidade' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Particular/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: /^Área de trabalho/i })).toBeDisabled()
    expect(screen.getByText(/Área de Trabalho \(Pessoal\)/)).toBeInTheDocument()
  })

  it('selects a different visibility option', async () => {
    const user = userEvent.setup()
    const onVisibilityChange = vi.fn()
    render(
      <BoardHeader
        planName="MVP Board"
        plan={{ role: 'ADMIN', visibility: 'PUBLIC' }}
        onVisibilityChange={onVisibilityChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Alterar visibilidade' }))
    await user.click(screen.getByRole('radio', { name: /Particular/i }))

    expect(onVisibilityChange).toHaveBeenCalledWith('private')
  })
})
