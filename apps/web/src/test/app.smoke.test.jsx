import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { normalizePlanRecord } from '../shared/contracts/planContracts.js'
import { ROUTES } from '../shared/config/routes.js'
import {
  createAccountStore,
  createDemoSession,
  renderApp,
} from './renderApp.jsx'

async function expectWorkspaceHomeShell() {
  await waitFor(() => {
    expect(window.location.pathname).toBe('/workspace')
  }, { timeout: 4000 })

  expect(
    await screen.findByRole('link', { name: 'Workspace' }, { timeout: 4000 }),
  ).toHaveAttribute('aria-current', 'page')
  expect(await screen.findByRole('heading', { name: 'Planos' })).toBeInTheDocument()
}

function formatTodayAsScheduleDateValue() {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = String(today.getFullYear() % 100).padStart(2, '0')

  return `${day}/${month}/${year}`
}

function formatCalendarHeading(monthOffset = 0) {
  const today = new Date()
  const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

async function loginFromProtectedRedirect(user) {
  await user.type(await screen.findByLabelText('E-mail'), 'arthur@example.com')
  await user.type(screen.getByLabelText('Senha'), '12345678')
  await user.click(screen.getByRole('button', { name: /continuar com e-mail/i }))
}

describe('App smoke flows', () => {
  it('normalizes legacy and pt-BR card dates to compact pt-BR labels', () => {
    const plan = normalizePlanRecord({
      boardColumns: [
        {
          title: 'Backlog',
          cards: [
            { title: 'Legacy fixed date', dueDate: 'Aug 3' },
            { title: 'Legacy relative date', dueDate: 'Today' },
            { title: 'Compact pt-BR date', dueDate: '3 fev' },
          ],
        },
      ],
    })

    const [fixedDateCard, relativeDateCard, ptBrDateCard] = plan.boardColumns[0].cards

    expect(fixedDateCard.dueDate).toBe('3 ago')
    expect(fixedDateCard.schedule.dueDateValue).toBe('03/08/26')
    expect(fixedDateCard.schedule).not.toHaveProperty('recurringValue')
    expect(fixedDateCard.schedule).not.toHaveProperty('reminderValue')
    expect(relativeDateCard.dueDate).toBe('Hoje')
    expect(relativeDateCard.schedule.dueDateValue).toBe(formatTodayAsScheduleDateValue())
    expect(ptBrDateCard.dueDate).toBe('3 fev')
    expect(ptBrDateCard.schedule.dueDateValue).toBe('03/02/26')
  })

  it('redirects anonymous /app access to login', async () => {
    renderApp('/app')

    expect(await screen.findByRole('button', { name: /continuar com e-mail/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('redirects the legacy app route to the workspace for a demo session', async () => {
    renderApp('/app', { session: createDemoSession() })

    await expectWorkspaceHomeShell()
    expect(window.location.pathname).toBe('/workspace')
    expect(screen.getAllByText('Lançamento do Produto — Q3')[0]).toBeInTheDocument()
  })

  it('resolves /app to last context when openLastCtx is enabled', async () => {
    const session = createDemoSession({
      user: {
        id: 'route-last-context-user',
      },
    })
    const userId = session.user.id
    window.localStorage.setItem(
      `plan-things:settings:v1:${userId}`,
      JSON.stringify({
        homePage: 'workspace',
        openLastCtx: true,
      }),
    )
    window.localStorage.setItem(`plan-things:last-context:v1:${userId}`, '/workspace/board/product-launch-q3')

    renderApp('/app', { session })

    await waitFor(() => {
      expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
    }, { timeout: 4000 })
    expect(await screen.findAllByText('Adicionar lista', {}, { timeout: 4000 })).not.toHaveLength(0)
  })

  it('resolves /app to homePage when openLastCtx is disabled', async () => {
    const session = createDemoSession({
      user: {
        id: 'route-home-page-user',
      },
    })
    const userId = session.user.id
    window.localStorage.setItem(
      `plan-things:settings:v1:${userId}`,
      JSON.stringify({
        homePage: 'calendar',
        openLastCtx: false,
      }),
    )
    window.localStorage.setItem(`plan-things:last-context:v1:${userId}`, '/workspace/board/product-launch-q3')

    renderApp('/app', { session })

    expect(await screen.findByRole('heading', { name: formatCalendarHeading() })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
  })

  it('restores the workspace after login when the route was protected', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await loginFromProtectedRedirect(user)

    await expectWorkspaceHomeShell()
  })

  it('restores the board route after login when the route was protected', async () => {
    const user = userEvent.setup()

    renderApp('/workspace/board/product-launch-q3')

    await loginFromProtectedRedirect(user)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
    }, { timeout: 4000 })
    expect(await screen.findAllByText('Adicionar lista', {}, { timeout: 4000 })).not.toHaveLength(0)
  })

  it('redirects the legacy files route to workspace after login', async () => {
    const user = userEvent.setup()

    renderApp('/files')

    await loginFromProtectedRedirect(user)

    await expectWorkspaceHomeShell()
  })

  it('restores the calendar mode inside the board after login when the route was protected', async () => {
    const user = userEvent.setup()

    renderApp('/calendar')

    await loginFromProtectedRedirect(user)

    expect(await screen.findByRole('heading', { name: formatCalendarHeading() })).toBeInTheDocument()
    await waitFor(() => {
      expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
    })
  })

  it('redirects anonymous invite access to login with the invite notice', async () => {
    renderApp(`${ROUTES.planInvite.replace(':token', 'token-123')}`)

    expect(await screen.findByRole('button', { name: /continuar com e-mail/i })).toBeInTheDocument()
    expect(screen.getByText('Faça login para aceitar o convite.')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('preserves the settings modal background after logging in from a protected callback route', async () => {
    const user = userEvent.setup()

    renderApp('/settings?section=integrations&gmail=connected&background=%2Ffiles')

    expect(await screen.findByRole('button', { name: /continuar com e-mail/i })).toBeInTheDocument()

    await loginFromProtectedRedirect(user)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/settings')
    }, { timeout: 4000 })
    expect(await screen.findByRole('dialog', { name: 'Configurações' }, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps legacy seeded due dates in pt-BR after opening and saving the date modal', async () => {
    const user = userEvent.setup()

    renderApp('/workspace/board/product-launch-q3', { session: createDemoSession() })

    await user.click(await screen.findByRole('button', { name: /abrir cartão pesquisa de concorrentes/i }))

    await user.click(screen.getByRole('button', { name: /03\/08\/26/ }))
    expect(screen.getByRole('dialog', { name: 'Agendar data e horário' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Agendar data e horário' })).not.toBeInTheDocument()
    })

    expect(screen.getAllByText('Pesquisa de concorrentes')).not.toHaveLength(0)
    expect(screen.getAllByText('3 ago')).not.toHaveLength(0)
  })

  it('keeps legacy relative due dates in pt-BR after opening and saving the date modal', async () => {
    const user = userEvent.setup()

    renderApp('/workspace/board/product-launch-q3', { session: createDemoSession() })

    await user.click(await screen.findByRole('button', { name: /abrir cartão copy da campanha de lançamento/i }))

    await user.click(screen.getByRole('button', { name: 'Datas' }))
    expect(screen.getByRole('dialog', { name: 'Agendar data e horário' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Agendar data e horário' })).not.toBeInTheDocument()
    })

    expect(screen.getAllByText('Copy da campanha de lançamento')).not.toHaveLength(0)
    expect(screen.getAllByText('Hoje')).not.toHaveLength(0)
  })

  it('preserves the plan id when redirecting legacy board deep links', async () => {
    renderApp('/kanban/product-launch-q3', { session: createDemoSession() })

    expect(await screen.findAllByText('Adicionar lista')).not.toHaveLength(0)
    expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
    expect(screen.getAllByText('Lançamento do Produto — Q3')[0]).toBeInTheDocument()
  })

  it('redirects the authenticated legacy files library route to workspace', async () => {
    renderApp('/files', { session: createDemoSession() })

    expect(await screen.findByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')
    expect(window.location.pathname).toBe('/workspace')
    expect(screen.queryByPlaceholderText('Buscar arquivos...')).not.toBeInTheDocument()
  })

  it('renders the calendar board view and opens the event dialog', async () => {
    const user = userEvent.setup()

    renderApp('/calendar', { session: createDemoSession() })

    expect(await screen.findByRole('heading', { name: formatCalendarHeading() })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
    expect(screen.getByRole('button', { name: /novo evento/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar eventos')).toBeInTheDocument()
    expect(screen.getAllByText('Sync diário de produto')).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /novo evento/i }))

    expect(await screen.findByRole('dialog', { name: 'Novo evento' })).toBeInTheDocument()
  })

  it('switches calendar views, navigates months, creates events, and keeps search safe', async () => {
    const user = userEvent.setup()

    renderApp('/calendar', { session: createDemoSession() })

    expect(await screen.findByRole('heading', { name: formatCalendarHeading() })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')

    await user.click(screen.getByRole('button', { name: 'Dia' }))
    expect(screen.getByRole('region', { name: 'Calendário diário' })).toBeInTheDocument()
    expect(screen.getByText('Vista diária')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Semana de trabalho' }))
    expect(screen.getByRole('region', { name: 'Calendário semanal' })).toBeInTheDocument()
    expect(screen.getByText('Semana útil')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Semana$/ }))
    expect(screen.getByText('Vista semanal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mês' }))
    expect(screen.getByText('Vista mensal')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Modo divisão' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sync diário de produto/i }))
    expect(screen.getByText('Teams · Arthur Fleming')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar agenda' }))
    expect(screen.queryByText('Teams · Arthur Fleming')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sync diário de produto/i }))
    expect(screen.getByText('Teams · Arthur Fleming')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Próximo mês' })[0])
    expect(await screen.findByRole('heading', { name: formatCalendarHeading(1) })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /novo evento/i }))
    const eventDialog = await screen.findByRole('dialog', { name: 'Novo evento' })
    await user.type(within(eventDialog).getByRole('textbox'), 'Review de prontidão do backend')
    await user.click(within(eventDialog).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findAllByText('Review de prontidão do backend')).not.toHaveLength(0)
    await waitFor(() => {
      const statuses = screen.getAllByRole('status')
      expect(statuses.some((status) => status.textContent?.includes('Evento "Review de prontidão do backend" criado'))).toBe(true)
    })

    await user.click(screen.getAllByRole('button', { name: 'Mês anterior' })[0])
    expect(await screen.findByRole('heading', { name: formatCalendarHeading() })).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('Buscar eventos'))
    await user.type(screen.getByPlaceholderText('Buscar eventos'), 'Checkpoint do release')

    expect(await screen.findByText('Checkpoint do release')).toBeInTheDocument()
  }, 20000)

  it('opens the dock account menu', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    const accountMenuTrigger = document.querySelector('[data-sidebar-user-button]')
    expect(accountMenuTrigger).not.toBeNull()
    await user.click(accountMenuTrigger)

    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /contas salvas de arthur santos/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Meu perfil' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Upgrade' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Configurações' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })

  it('opens the saved accounts submenu from the dock account menu', async () => {
    const user = userEvent.setup()
    const primarySession = createDemoSession({
      user: {
        fullName: 'Arthur Santos',
        email: 'arthur@example.com',
      },
    })
    const secondarySession = createDemoSession({
      user: {
        fullName: 'Bruna Costa',
        email: 'bruna@example.com',
      },
    })

    renderApp('/workspace', {
      session: createAccountStore([
        primarySession,
        secondarySession,
      ], primarySession.user.id),
    })

    const accountMenuTrigger = document.querySelector('[data-sidebar-user-button]')
    expect(accountMenuTrigger).not.toBeNull()
    await user.click(accountMenuTrigger)
    await user.click(await screen.findByRole('button', { name: /contas salvas de arthur santos/i }))

    expect(await screen.findByRole('menu', { name: 'Contas salvas' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /arthur santos/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /bruna costa/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Adicionar conta' })).toBeInTheDocument()
  })

  it('switches accounts from the dock account submenu', async () => {
    const user = userEvent.setup()
    const primarySession = createDemoSession({
      user: {
        fullName: 'Arthur Santos',
        email: 'arthur@example.com',
      },
    })
    const secondarySession = createDemoSession({
      user: {
        fullName: 'Bruna Costa',
        email: 'bruna@example.com',
      },
    })

    renderApp('/workspace', {
      session: createAccountStore([
        primarySession,
        secondarySession,
      ], primarySession.user.id),
    })

    const accountMenuTrigger = document.querySelector('[data-sidebar-user-button]')
    expect(accountMenuTrigger).not.toBeNull()
    await user.click(accountMenuTrigger)
    await user.click(await screen.findByRole('button', { name: /contas salvas de arthur santos/i }))
    await user.click(await screen.findByRole('menuitemradio', { name: /bruna costa/i }))

    await waitFor(() => {
      expect(document.querySelector('[title="Bruna Costa"]')).not.toBeNull()
      expect(window.location.pathname).toBe('/workspace')
    })
  })

  it('opens the login screen in add-account mode from the dock account submenu', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    const accountMenuTrigger = document.querySelector('[data-sidebar-user-button]')
    expect(accountMenuTrigger).not.toBeNull()
    await user.click(accountMenuTrigger)
    await user.click(await screen.findByRole('button', { name: /contas salvas de arthur santos/i }))
    await user.click(await screen.findByRole('menuitem', { name: 'Adicionar conta' }))

    expect(await screen.findByRole('heading', { name: 'Entre com outra conta' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('opens the account section from the dock settings link', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    await user.click(await screen.findByRole('button', { name: 'Configurações' }))

    expect(await screen.findByRole('dialog', { name: 'Configurações' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/settings')
    expect(screen.getByRole('button', { name: 'Conta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Configurações' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the workspace section from Upgrade in the dock account menu', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    const accountMenuTrigger = document.querySelector('[data-sidebar-user-button]')
    expect(accountMenuTrigger).not.toBeNull()
    await user.click(accountMenuTrigger)
    await user.click(await screen.findByRole('menuitem', { name: 'Upgrade' }))

    expect(await screen.findByRole('dialog', { name: 'Configurações' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/settings')
    expect(window.location.search).toBe('?section=workspace')
    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Configurações' })).toHaveAttribute('aria-current', 'page')
  })

  it('returns to the login route after logging out from the dock account menu', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', {
      session: createDemoSession({
        user: {
          id: 'logout-route-user',
        },
      }),
    })

    const accountMenuTrigger = document.querySelector('[data-sidebar-user-button]')
    expect(accountMenuTrigger).not.toBeNull()
    await user.click(accountMenuTrigger)
    await user.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login')
    })

    expect(screen.getByRole('button', { name: /continuar com e-mail/i })).toBeInTheDocument()
  })

  it('opens the settings panel as an overlay from the dock settings link', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    expect(await screen.findByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')

    await user.click(await screen.findByRole('button', { name: 'Configurações' }))

    expect(await screen.findByRole('dialog', { name: 'Configurações' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/settings')
    expect(screen.getByRole('button', { name: 'Conta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Configurações' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Workspace' }))

    expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar configurações' }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/workspace')
      expect(screen.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')
  })

  it('reopens settings over the original page after a Gmail callback redirect', async () => {
    const user = userEvent.setup()

    renderApp('/settings?section=integrations&gmail=connected&background=%2Ffiles', {
      session: createDemoSession(),
    })

    expect(await screen.findByRole('dialog', { name: 'Configurações' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByText('Gmail conectado com sucesso.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar configurações' }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/workspace')
      expect(screen.queryByRole('dialog', { name: 'Configurações' })).not.toBeInTheDocument()
    })
  })

  it('keeps save action only in account and uses autosave sections', async () => {
    const user = userEvent.setup()

    renderApp('/settings', { session: createDemoSession() })

    const settingsDialog = await screen.findByRole('dialog', { name: 'Configurações' })
    expect(screen.getByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getAllByRole('button', { name: 'Salvar alterações' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /salvar preferências/i })).not.toBeInTheDocument()

    await user.click(within(settingsDialog).getByRole('button', { name: 'Notificações' }))

    const switches = screen.getAllByRole('switch')
    const disabledSwitches = switches.filter((item) => item.hasAttribute('disabled'))
    expect(disabledSwitches).toHaveLength(2)
  })

  it('creates a new plan from the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    await user.click((await screen.findAllByRole('button', { name: /novo plano/i }))[0])

    expect(await screen.findByRole('dialog', { name: 'Criar novo plano' })).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /título do plano/i }), 'Plano Frontend QA')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(await screen.findAllByText('Plano Frontend QA')).not.toHaveLength(0)
    expect(screen.getAllByRole('heading', { name: 'Plano Frontend QA' })).not.toHaveLength(0)
  })

  it('accepts a custom cover image when creating a plan', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    await user.click((await screen.findAllByRole('button', { name: /novo plano/i }))[0])

    const dialog = await screen.findByRole('dialog', { name: 'Criar novo plano' })
    const fileInput = dialog.querySelector('input[type="file"]')
    const file = new File(['cover-image'], 'cover.png', { type: 'image/png' })

    await user.upload(fileInput, file)

    expect(screen.getByRole('button', { name: 'Enviar imagem própria' }).className).toMatch(/coverOptionActive/)

    await user.type(screen.getByRole('textbox', { name: /título do plano/i }), 'Plano com capa')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(await screen.findAllByText('Plano com capa')).not.toHaveLength(0)
  })

  it('accepts a custom cover image when changing plan background', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    await user.click((await screen.findAllByRole('button', { name: 'Mais opções' }))[0])
    await user.click(screen.getByRole('menuitem', { name: 'Alterar background' }))

    const dialog = await screen.findByRole('dialog', { name: 'Alterar background do plano' })
    const fileInput = dialog.querySelector('input[type="file"]')
    const file = new File(['cover-image'], 'background.png', { type: 'image/png' })

    await user.upload(fileInput, file)

    expect(await screen.findByText(/Background de "Lançamento do Produto — Q3" atualizado/i)).toBeInTheDocument()
  })

  it('opens inline rename when choosing Renomear from the plan menu', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    await user.click((await screen.findAllByRole('button', { name: 'Mais opções' }))[0])
    await user.click(screen.getByRole('menuitem', { name: 'Renomear' }))

    const input = await screen.findByDisplayValue('Lançamento do Produto — Q3')
    await user.clear(input)
    await user.type(input, 'Plano Renomeado QA')
    await user.click(screen.getByLabelText('Confirmar novo nome'))

    expect(await screen.findAllByText('Plano Renomeado QA')).not.toHaveLength(0)
  })

  it('renders the shared authenticated header across product screens', async () => {
    const user = userEvent.setup()

    renderApp('/workspace', { session: createDemoSession() })

    expect(await screen.findByRole('link', { name: 'Workspace' })).toHaveAttribute('aria-current', 'page')
    const header = document.querySelector('[data-authenticated-app-header]')
    expect(header).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Workspace' })).toBeInTheDocument()
    expect(within(header).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(within(header).getByRole('link', { name: 'Plano' })).toBeInTheDocument()
    expect(within(header).getByRole('button', { name: 'GitHub' })).toBeInTheDocument()
    expect(within(header).getByRole('button', { name: 'Configurações' })).toBeInTheDocument()
    expect(within(header).getByRole('button', { name: 'Abrir menu da conta' })).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /lançamento do produto/i }))

    expect(await screen.findAllByText('Adicionar lista')).not.toHaveLength(0)
    expect(document.querySelector('[data-authenticated-app-header]')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plano' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the liquid-glass preference in general settings', async () => {
    const user = userEvent.setup()

    renderApp('/settings', { session: createDemoSession() })

    expect(await screen.findByRole('heading', { name: 'Configurações' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Preferências gerais' }))

    const liquidGlassLabel = await screen.findByText('Liquid-glass')
    const liquidGlassField = liquidGlassLabel.closest('div')?.parentElement
    const liquidGlassSwitch = within(liquidGlassField).getByRole('switch')

    expect(screen.getByText(/futuro efeito de vidro líquido/i)).toBeInTheDocument()
    expect(liquidGlassSwitch).toBeEnabled()
  })
})
