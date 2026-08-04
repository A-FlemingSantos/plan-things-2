import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TestMemoryRouter } from '../../../test/testRouter.jsx'
import AuthenticatedAppHeader from './AuthenticatedAppHeader.jsx'

vi.mock('../../../features/auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({
    workspace: { name: 'Área de trabalho pessoal' },
  }),
}))

vi.mock('../../../features/workspace/context/PlansContext.jsx', () => ({
  usePlans: () => ({
    plans: [{ id: 'plan-1', name: 'Lancamento Q3' }],
  }),
}))

vi.mock('../../../features/preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

describe('AuthenticatedAppHeader', () => {
  it('renders navigable breadcrumb links for nested routes', () => {
    render(
      <TestMemoryRouter initialEntries={['/workspace/board/plan-1']}>
        <AuthenticatedAppHeader pathname="/workspace/board/plan-1" />
      </TestMemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Área de trabalho pessoal' })).toHaveAttribute('href', '/workspace')
    expect(screen.getByText('Lancamento Q3')).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Quadros' })).not.toBeInTheDocument()
  })
})
