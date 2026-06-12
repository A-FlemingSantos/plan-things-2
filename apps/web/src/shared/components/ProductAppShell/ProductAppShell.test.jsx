import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../../../features/auth/context/AuthContext.jsx'
import { TestMemoryRouter } from '../../../test/testRouter.jsx'
import ProductAppShell from './ProductAppShell.jsx'

function renderProductAppShell(ui, { route = '/workspace' } = {}) {
  return render(
    <TestMemoryRouter initialEntries={[route]}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </TestMemoryRouter>,
  )
}

describe('ProductAppShell', () => {
  it('renders a collapsible sidebar with navigation on desktop', () => {
    renderProductAppShell(
      <ProductAppShell contentClassName="content" contentTag="main">
        <h1>Workspace</h1>
      </ProductAppShell>,
    )

    const sidebar = document.querySelector('[data-product-sidebar]')
    const content = screen.getByRole('main')

    expect(sidebar).toBeInTheDocument()
    expect(content).toHaveClass('content')
    expect(within(sidebar).getByRole('button', { name: 'Início' })).toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: 'Teams' })).toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: 'Configurações' })).toBeInTheDocument()
    expect(sidebar.querySelector('[data-sidebar-collapse-button]')).toBeInTheDocument()
  })

  it('persists the collapsed sidebar state in localStorage', async () => {
    const user = userEvent.setup()
    window.localStorage.clear()

    renderProductAppShell(
      <ProductAppShell contentClassName="content" contentTag="main">
        <h1>Workspace</h1>
      </ProductAppShell>,
    )

    await user.click(screen.getByRole('button', { name: 'Recolher barra lateral' }))

    expect(document.querySelector('[data-product-sidebar]')?.dataset.collapsed).toBe('true')
    expect(window.localStorage.getItem('plan-things:sidebar-collapsed:v1:anonymous')).toBe('true')
  })
})
