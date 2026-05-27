import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Toggle from './Toggle.jsx'

describe('Toggle', () => {
  it('renders switch state and label', () => {
    render(<Toggle checked aria-label="Desconectar GitHub" />)

    expect(screen.getByRole('switch', { name: 'Desconectar GitHub' })).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with the next checked state', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<Toggle checked={false} onChange={handleChange} aria-label="Conectar GitHub" />)

    await user.click(screen.getByRole('switch', { name: 'Conectar GitHub' }))

    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('does not call onChange while disabled', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<Toggle disabled onChange={handleChange} aria-label="Conectar GitHub" />)

    await user.click(screen.getByRole('switch', { name: 'Conectar GitHub' }))

    expect(handleChange).not.toHaveBeenCalled()
  })
})
