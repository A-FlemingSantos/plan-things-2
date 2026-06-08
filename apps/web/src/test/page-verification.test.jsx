import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createDemoSession, renderApp } from './renderApp.jsx'
import { installMatchMediaController } from './matchMedia.js'

async function expectWorkspaceHomeShell() {
  await waitFor(() => {
    expect(window.location.pathname).toBe('/workspace')
  }, { timeout: 4000 })

  expect(
    await screen.findByPlaceholderText('Buscar planos...', {}, { timeout: 4000 }),
  ).toBeInTheDocument()
}

describe('Page verification flows', () => {
  it('verifies key landing-page interactions', async () => {
    const user = userEvent.setup()

    renderApp('/')

    expect(await screen.findByRole('heading', { name: /seu time, no mesmo quadro/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /começar grátis/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /começar grátis/i })[0]).toHaveAttribute('href', '/cadastro')
    expect(screen.getByRole('link', { name: /entrar/i })).toHaveAttribute('href', '/login')

    await user.click(screen.getByRole('button', { name: 'Expandir tudo' }))
    expect(screen.getByText(/nosso assistente de ia analisa/i)).toBeInTheDocument()
    expect(screen.getByText(/você pode cancelar quando quiser/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Recolher tudo' }))
    expect(screen.queryByText(/nosso assistente de ia analisa/i)).not.toBeInTheDocument()
  }, 15000)

  it('verifies login interactions and forgot-password navigation', async () => {
    const user = userEvent.setup()

    renderApp('/login')

    const password = await screen.findByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('link', { name: /esqueceu a senha/i }))
    expect(await screen.findByRole('heading', { name: /recupere sua senha/i })).toBeInTheDocument()
  })

  it('verifies register interactions and consent toggle', async () => {
    const user = userEvent.setup()

    renderApp('/cadastro')

    expect(await screen.findByLabelText('Nome completo')).toBeInTheDocument()

    const password = screen.getByLabelText('Senha')
    const submit = screen.getByRole('button', { name: /criar conta/i })
    expect(submit).toBeDisabled()

    await user.type(password, '1234567890')
    expect(password).toHaveValue('1234567890')

    const consent = screen.getByRole('checkbox')
    expect(consent).toHaveAttribute('aria-checked', 'false')
    await user.click(consent)
    expect(consent).toHaveAttribute('aria-checked', 'true')
    expect(submit).toBeEnabled()
  })

  it('verifies placeholder info-page navigation', async () => {
    const user = userEvent.setup()

    renderApp('/help')

    expect(await screen.findByRole('heading', { name: 'Central de ajuda' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ir para cadastro' }))
    expect(await screen.findByRole('heading', { name: /crie sua conta/i })).toBeInTheDocument()
  })

  it('verifies workspace search empty state and recovery', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    const search = await screen.findByPlaceholderText('Buscar planos...')
    await user.type(search, 'nao-existe')

    expect(await screen.findByText('Nenhum plano encontrado')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /limpar busca de planos/i }))
    expect(screen.queryByText('Nenhum plano encontrado')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar planos...')).toHaveValue('')
  })

  it('verifies kanban utility panels', async () => {
    const user = userEvent.setup()

    renderApp('/workspace/board/product-launch-q3', { session: createDemoSession() })

    expect(await screen.findByText('Adicionar lista')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /caixa de entrada/i }))
    expect(await screen.findByLabelText('Caixa de entrada')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /planejador/i }))
    expect(await screen.findByLabelText('Planejador')).toBeInTheDocument()
    expect(screen.queryByLabelText('Caixa de entrada')).not.toBeInTheDocument()

    const toolbar = screen.getByText('Quadro').closest('div[aria-label="Atalhos do quadro"]')
    expect(toolbar).not.toBeNull()
    const intelligenceButton = within(toolbar).getByRole('button', { name: 'Intelligence' })
    expect(intelligenceButton).toHaveAttribute('aria-expanded', 'false')
    expect(intelligenceButton).toHaveAttribute('aria-controls', 'board-intelligence-panel')

    await user.click(intelligenceButton)

    expect(screen.getByLabelText('Chat de IA')).toBeInTheDocument()
    expect(screen.queryByLabelText('Planejador')).not.toBeInTheDocument()
  })

  it('keeps the mobile kanban as web without app-style list/task switching', async () => {
    installMatchMediaController(390)

    renderApp('/workspace/board/product-launch-q3', { session: createDemoSession() })

    expect(await screen.findByText('Adicionar lista')).toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Visões do quadro' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tarefas' })).not.toBeInTheDocument()
  })

  it('verifies legacy files route lands in the workspace', async () => {
    renderApp('/files', { session: createDemoSession() })

    await expectWorkspaceHomeShell()
    expect(window.location.pathname).toBe('/workspace')
    expect(screen.queryByPlaceholderText('Buscar arquivos...')).not.toBeInTheDocument()
  })

  it('verifies auth submit reaches the workspace shell after the loading state', async () => {
    const user = userEvent.setup()

    renderApp('/login')

    await user.type(await screen.findByLabelText('E-mail'), 'arthur@example.com')
    await user.type(screen.getByLabelText('Senha'), '12345678')
    await user.click(screen.getByRole('button', { name: /continuar com e-mail/i }))

    await expectWorkspaceHomeShell()
  }, 10000)
})
