import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PlanGitHubIntegrationModal from './PlanGitHubIntegrationModal.jsx'

function renderModal(props = {}) {
  const anchorRef = createRef()
  const view = render(
    <>
      <button ref={anchorRef} type="button">Abrir</button>
      <PlanGitHubIntegrationModal
        open
        anchorRef={anchorRef}
        onClose={() => {}}
        planName="MVP"
        {...props}
      />
    </>,
  )
  return { ...view, anchorRef }
}

describe('PlanGitHubIntegrationModal', () => {
  it('lets a manager connect a repository returned by search', async () => {
    const user = userEvent.setup()
    const onConnect = vi.fn()
    renderModal({
      status: 'ready',
      isManager: true,
      searchQuery: 'plan',
      searchStatus: 'success',
      searchResults: [{
        id: 'repo-1',
        fullName: 'plan-things/app',
        isPrivate: true,
        defaultBranch: 'main',
      }],
      onConnectRepo: onConnect,
    })

    expect(screen.getByRole('dialog', { name: 'Integrações do GitHub do plano' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Conectar' }))
    expect(onConnect).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'plan-things/app' }))
  })

  it('keeps repository management read-only for members', () => {
    renderModal({
      status: 'ready',
      isManager: false,
      connectedRepos: [{
        id: 'repo-1',
        fullName: 'plan-things/app',
        connectionStatus: 'connected',
      }],
    })

    expect(screen.getByText(/Somente gerentes do plano/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Buscar repositórios do GitHub' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remover/ })).not.toBeInTheDocument()
  })
})
