import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { TestMemoryRouter } from '../../../../test/testRouter.jsx'
import DocInviteAccept from './DocInviteAccept.jsx'

const apiMocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}))

const authMocks = vi.hoisted(() => ({
  accessToken: 'invitee-token',
}))

const navigationMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('../../../../shared/api/apiClient.js', () => apiMocks)

vi.mock('../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => authMocks,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigationMocks.navigate,
  }
})

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => children,
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children }) => children,
}))

function renderInvitePage() {
  return render(
    <TestMemoryRouter initialEntries={['/docs/invites/invite-token']}>
      <Routes>
        <Route path="/docs/invites/:token" element={<DocInviteAccept />} />
      </Routes>
    </TestMemoryRouter>,
  )
}

describe('DocInviteAccept', () => {
  beforeEach(() => {
    apiMocks.apiRequest.mockReset()
    navigationMocks.navigate.mockReset()
  })

  it('auto-accepts a pending invite and opens the document', async () => {
    apiMocks.apiRequest
      .mockResolvedValueOnce({
        status: 'PENDING',
        documentId: 'doc-123',
        documentTitle: 'Compartilhado',
        role: 'EDITOR',
      })
      .mockResolvedValueOnce({
        documentId: 'doc-123',
        message: 'Convite aceito com sucesso.',
      })

    renderInvitePage()

    expect(await screen.findByText('Abrindo documento…')).toBeInTheDocument()

    await waitFor(() => {
      expect(apiMocks.apiRequest).toHaveBeenCalledWith('/api/documents/invites/invite-token/accept', {
        method: 'POST',
        token: 'invitee-token',
      })
      expect(navigationMocks.navigate).toHaveBeenCalledWith('/docs/doc-123', { replace: true })
    })
  })

  it('opens the document when the invite is already accepted', async () => {
    apiMocks.apiRequest.mockResolvedValueOnce({
      status: 'ACCEPTED',
      documentId: 'doc-456',
      documentTitle: 'Já aceito',
      role: 'VIEWER',
    })

    renderInvitePage()

    await waitFor(() => {
      expect(navigationMocks.navigate).toHaveBeenCalledWith('/docs/doc-456', { replace: true })
    })
    expect(apiMocks.apiRequest).toHaveBeenCalledTimes(1)
  })

  it('shows an error when the invite cannot be accepted', async () => {
    apiMocks.apiRequest
      .mockResolvedValueOnce({
        status: 'PENDING',
        documentId: 'doc-789',
        documentTitle: 'Falhou',
        role: 'VIEWER',
      })
      .mockRejectedValueOnce(new Error('Este convite foi enviado para outro e-mail.'))

    renderInvitePage()

    expect(await screen.findByText('Este convite foi enviado para outro e-mail.')).toBeInTheDocument()
    expect(navigationMocks.navigate).not.toHaveBeenCalled()
  })
})
