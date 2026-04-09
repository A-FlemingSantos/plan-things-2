import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from './renderApp.jsx'

function formatTodayAsScheduleDateValue() {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = String(today.getFullYear() % 100).padStart(2, '0')

  return `${day}/${month}/${year}`
}

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

  it('keeps legacy seeded due dates stable after opening and saving the date modal', async () => {
    const user = userEvent.setup()

    renderApp('/workspace/board/product-launch-q3')

    await user.click(await screen.findByText('Competitive landscape research'))
    expect(await screen.findByRole('button', { name: 'Salvar alteracoes' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Datas' }))
    expect(screen.getByLabelText('Due date')).toHaveValue('03/08/26')

    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar alteracoes' }))

    expect(await screen.findByText('Competitive landscape research')).toBeInTheDocument()
    expect(screen.getByText('Aug 3')).toBeInTheDocument()
  })

  it('keeps legacy relative due dates stable after opening and saving the date modal', async () => {
    const user = userEvent.setup()

    renderApp('/workspace/board/product-launch-q3')

    await user.click(await screen.findByText('Launch campaign copy'))
    expect(await screen.findByRole('button', { name: 'Salvar alteracoes' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Datas' }))
    expect(screen.getByLabelText('Due date')).toHaveValue(formatTodayAsScheduleDateValue())

    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar alteracoes' }))

    expect(await screen.findByText('Launch campaign copy')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('preserves the plan id when redirecting legacy board deep links', async () => {
    renderApp('/kanban/product-launch-q3')

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

  it('preserves the plan id when redirecting legacy canvas deep links', async () => {
    renderApp('/app/canvas/product-launch-q3')

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

  it('renders the calendar agenda and opens the event dialog', async () => {
    const user = userEvent.setup()

    renderApp('/calendar')

    expect(await screen.findByRole('heading', { name: /abril 2026/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /novo evento/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar eventos')).toBeInTheDocument()
    expect(screen.getAllByText('Daily product sync')).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /novo evento/i }))

    expect(await screen.findByRole('dialog', { name: 'Novo evento' })).toBeInTheDocument()
  })

  it('opens the shared sidebar account menu outside the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/files')

    await user.click(await screen.findByRole('button', { name: /arthur santos/i }))

    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'My Profile' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument()
  })

  it('navigates into folders in files without breaking the breadcrumb', async () => {
    const user = userEvent.setup()

    renderApp('/files')

    await user.dblClick(await screen.findByText('Product Design'))

    expect(await screen.findByRole('button', { name: 'Product Design' })).toBeInTheDocument()
    expect(screen.getByText('Components')).toBeInTheDocument()
    expect(screen.getByText('Icons')).toBeInTheDocument()
    expect(screen.getByText('6 items')).toBeInTheDocument()
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

  it('keeps the sidebar collapsed state across product screens', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await user.click(await screen.findByRole('button', { name: /collapse sidebar/i }))
    await user.click(await screen.findByRole('button', { name: /open board/i }))

    expect(await screen.findByText('Add list')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })
})
