import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TestMemoryRouter } from '../../../test/testRouter.jsx'
import AuthenticatedAppHeader from './AuthenticatedAppHeader.jsx'

vi.mock('../../../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    workspace: { name: 'Área de trabalho pessoal' },
    currentUser: { fullName: 'Arthur Santos', email: 'arthur@example.com' },
    savedAccounts: [],
    isAuthenticated: true,
  }),
}))

vi.mock('../../../features/workspace/context/PlansContext.jsx', () => ({
  usePlans: () => ({
    plans: [{ id: 'plan-1', name: 'Lancamento Q3' }],
  }),
}))

vi.mock('../../context/AppChromeContext.jsx', () => ({
  useAppChrome: () => ({
    pageBreadcrumbLabel: null,
    setPageBreadcrumbLabel: () => {},
  }),
}))

vi.mock('../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../SidebarAccountMenu/SidebarAccountMenu.jsx', () => ({
  default: () => (
    <button type="button" aria-label="Abrir menu da conta">
      Conta
    </button>
  ),
}))

describe('AuthenticatedAppHeader', () => {
  it('places primary navigation on the left, then a pipe, then the breadcrumb', () => {
    render(
      <TestMemoryRouter initialEntries={['/workspace/board/plan-1']}>
        <AuthenticatedAppHeader pathname="/workspace/board/plan-1" />
      </TestMemoryRouter>,
    )

    const header = document.querySelector('[data-authenticated-app-header]')
    const primaryNav = screen.getByRole('navigation', { name: 'Navegação principal' })
    const breadcrumb = screen.getByRole('navigation', { name: 'Localização atual' })

    expect(header).toContainElement(primaryNav)
    expect(header).toContainElement(breadcrumb)
    expect(primaryNav.compareDocumentPosition(breadcrumb) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(header).toHaveTextContent('|')
    expect(screen.getByRole('link', { name: 'Workspace' })).toHaveAttribute('href', '/workspace')
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(screen.getByRole('link', { name: 'Plano' })).toHaveAttribute('href', '/workspace/board')
    expect(screen.getByRole('link', { name: 'Plano' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Área de trabalho pessoal' })).toHaveAttribute('href', '/workspace')
    expect(screen.getByText('Lancamento Q3')).toHaveAttribute('aria-current', 'page')
  })

  it('places GitHub, settings, and the account control on the right', () => {
    render(
      <TestMemoryRouter initialEntries={['/workspace']}>
        <AuthenticatedAppHeader pathname="/workspace" />
      </TestMemoryRouter>,
    )

    const header = document.querySelector('[data-authenticated-app-header]')
    const github = screen.getByRole('button', { name: 'GitHub' })
    const settings = screen.getByRole('button', { name: 'Configurações' })
    const account = screen.getByRole('button', { name: 'Abrir menu da conta' })

    expect(header.lastElementChild).toContainElement(github)
    expect(header.lastElementChild).toContainElement(settings)
    expect(header.lastElementChild).toContainElement(account)
    expect(github.compareDocumentPosition(settings) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(settings.compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
