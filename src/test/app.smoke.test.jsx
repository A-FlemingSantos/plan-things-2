import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

describe('App smoke flows', () => {
  it('redirects the legacy app route to the workspace', async () => {
    renderApp('/app')

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace')
    expect(screen.getByText('Current plan')).toBeInTheDocument()
    expect(screen.getAllByText('Product Launch — Q3')[0]).toBeInTheDocument()
  })

  it('opens the current plan board from the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await user.click(await screen.findByRole('button', { name: /open board/i }))

    expect(await screen.findByText('Add list')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
    expect(screen.getAllByText('Product Launch — Q3')[0]).toBeInTheDocument()
  })

  it('opens the current plan canvas from the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await user.click(await screen.findByRole('button', { name: /open canvas/i }))

    expect(await screen.findByText('4 cards')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/canvas/product-launch-q3')
    expect(screen.getAllByText('Product Launch — Q3')[0]).toBeInTheDocument()
  })

  it('renders the global files library', async () => {
    renderApp('/files')

    expect(await screen.findAllByRole('button', { name: /^my files$/i })).not.toHaveLength(0)
    expect(screen.getByPlaceholderText('Search files…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new folder/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^upload$/i })).toBeInTheDocument()
    expect(screen.getByText('Product Design')).toBeInTheDocument()
    expect(screen.getByText('Brand Identity 2025')).toBeInTheDocument()
  })

  it('creates a new plan from the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await user.click((await screen.findAllByRole('button', { name: /new plan/i }))[0])

    expect(await screen.findByRole('dialog', { name: 'Create new plan' })).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /titulo do plano/i }), 'Frontend QA Plan')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(await screen.findAllByText('Frontend QA Plan')).not.toHaveLength(0)
    expect(screen.getByText('Current')).toBeInTheDocument()
  })
})
