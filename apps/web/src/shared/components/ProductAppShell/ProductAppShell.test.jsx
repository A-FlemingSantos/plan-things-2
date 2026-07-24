import { render, screen } from '@testing-library/react'
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
  it('renders page content without the legacy sidebar chrome', () => {
    renderProductAppShell(
      <ProductAppShell contentClassName="content" contentTag="main">
        <h1>Workspace</h1>
      </ProductAppShell>,
    )

    const content = screen.getByRole('main')

    expect(document.querySelector('[data-product-sidebar]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-app-navigation-dock]')).not.toBeInTheDocument()
    expect(content).toHaveClass('content')
    expect(screen.getByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
  })
})
