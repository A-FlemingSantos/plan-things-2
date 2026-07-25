import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Loader from './Loader.jsx'

describe('Loader', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cycles ASCII line frames', () => {
    render(<Loader label="Carregando" speed={1} />)

    const glyph = screen.getByText('|', { selector: '[aria-hidden="true"]' })
    expect(glyph).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(screen.getByText('/', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(screen.getByText('-', { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
  })

  it('exposes an accessible status label', () => {
    render(<Loader label="Carregando planos" />)
    expect(screen.getByRole('status', { name: 'Carregando planos' })).toBeInTheDocument()
  })
})
