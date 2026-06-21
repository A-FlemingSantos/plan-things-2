import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AddCardComposer from './AddCardComposer.jsx'

const styles = new Proxy({}, { get: (_, key) => String(key) })

function buildProps(overrides = {}) {
  return {
    addingCard: true,
    setAddingCard: vi.fn(),
    newCardText: 'Novo cartão',
    setNewCardText: vi.fn(),
    onSubmit: vi.fn(),
    onDismiss: vi.fn(),
    errorMessage: null,
    isSubmitting: false,
    styles,
    ...overrides,
  }
}

describe('AddCardComposer', () => {
  it('closes when clicking outside the form shell', () => {
    const onDismiss = vi.fn()
    render(
      <>
        <AddCardComposer {...buildProps({ onDismiss })} />
        <button type="button">Fora do formulário</button>
      </>,
    )

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Fora do formulário' }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('stays open when clicking inside the form shell', () => {
    const onDismiss = vi.fn()
    render(<AddCardComposer {...buildProps({ onDismiss })} />)

    fireEvent.mouseDown(screen.getByLabelText('Título do cartão'))

    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('does not close on outside click while submitting', () => {
    const onDismiss = vi.fn()
    render(
      <>
        <AddCardComposer {...buildProps({ onDismiss, isSubmitting: true })} />
        <button type="button">Fora do formulário</button>
      </>,
    )

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Fora do formulário' }))

    expect(onDismiss).not.toHaveBeenCalled()
  })
})
