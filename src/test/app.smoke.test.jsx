import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { normalizePlanRecord } from '../shared/contracts/planContracts.js'
import { renderApp } from './renderApp.jsx'

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
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  return `${months[date.getMonth()]} ${date.getFullYear()}`
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

  it('redirects the legacy app route to the workspace', async () => {
    renderApp('/app')

    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace')
    expect(screen.getByText('Plano atual')).toBeInTheDocument()
    expect(screen.getAllByText('Lançamento do Produto — Q3')[0]).toBeInTheDocument()
  })

  it('opens the current plan board from the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await user.click(await screen.findByRole('button', { name: /abrir quadro/i }))

    expect(await screen.findByText('Adicionar lista')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
    expect(screen.getAllByText('Lançamento do Produto — Q3')[0]).toBeInTheDocument()
  })

  it('keeps legacy seeded due dates in pt-BR after opening and saving the date modal', async () => {
    const user = userEvent.setup()

    renderApp('/workspace/board/product-launch-q3')

    await user.click(await screen.findByText('Pesquisa de concorrentes'))
    expect(await screen.findByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Datas' }))
    expect(screen.getByLabelText('Data de entrega')).toHaveValue('03/08/26')
    expect(screen.queryByText('Recorrente')).not.toBeInTheDocument()
    expect(screen.queryByText('Definir lembrete')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Pesquisa de concorrentes')).toBeInTheDocument()
    expect(screen.getByText('3 ago')).toBeInTheDocument()
  })

  it('keeps legacy relative due dates in pt-BR after opening and saving the date modal', async () => {
    const user = userEvent.setup()

    renderApp('/workspace/board/product-launch-q3')

    await user.click(await screen.findByText('Copy da campanha de lançamento'))
    expect(await screen.findByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Datas' }))
    expect(screen.getByLabelText('Data de entrega')).toHaveValue(formatTodayAsScheduleDateValue())

    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Copy da campanha de lançamento')).toBeInTheDocument()
    expect(screen.getByText('Hoje')).toBeInTheDocument()
  })

  it('preserves the plan id when redirecting legacy board deep links', async () => {
    renderApp('/kanban/product-launch-q3')

    expect(await screen.findByText('Adicionar lista')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/workspace/board/product-launch-q3')
    expect(screen.getAllByText('Lançamento do Produto — Q3')[0]).toBeInTheDocument()
  })

  it('opens the current plan canvas from the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await user.click(await screen.findByRole('button', { name: /abrir canvas/i }))

    expect(await screen.findByText('4 cartões')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/canvas/product-launch-q3')
    expect(screen.getAllByText('Lançamento do Produto — Q3')[0]).toBeInTheDocument()
  })

  it('preserves the plan id when redirecting legacy canvas deep links', async () => {
    renderApp('/app/canvas/product-launch-q3')

    expect(await screen.findByText('4 cartões')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/canvas/product-launch-q3')
    expect(screen.getAllByText('Lançamento do Produto — Q3')[0]).toBeInTheDocument()
  })

  it('renders the global files library', async () => {
    renderApp('/files')

    expect(await screen.findAllByRole('button', { name: /^meus arquivos$/i })).not.toHaveLength(0)
    expect(screen.getByPlaceholderText('Buscar arquivos...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nova pasta/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^enviar$/i })).toBeInTheDocument()
    expect(screen.getByText('Design do Produto')).toBeInTheDocument()
    expect(screen.getByText('Identidade da Marca 2025')).toBeInTheDocument()
  })

  it('renders the calendar agenda and opens the event dialog', async () => {
    const user = userEvent.setup()

    renderApp('/calendar')

    expect(await screen.findByRole('heading', { name: formatCalendarHeading() })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /novo evento/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar eventos')).toBeInTheDocument()
    expect(screen.getAllByText('Sync diário de produto')).not.toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /novo evento/i }))

    expect(await screen.findByRole('dialog', { name: 'Novo evento' })).toBeInTheDocument()
  })

  it('switches calendar views, navigates months, creates events, and keeps search safe', async () => {
    const user = userEvent.setup()

    renderApp('/calendar')

    expect(await screen.findByRole('heading', { name: formatCalendarHeading() })).toBeInTheDocument()

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
    expect(screen.getByRole('status')).toHaveTextContent('Evento "Review de prontidão do backend" criado')

    await user.click(screen.getAllByRole('button', { name: 'Mês anterior' })[0])
    expect(await screen.findByRole('heading', { name: formatCalendarHeading() })).toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('Buscar eventos'))
    await user.type(screen.getByPlaceholderText('Buscar eventos'), 'Checkpoint do release')

    expect(await screen.findByText('Checkpoint do release')).toBeInTheDocument()
  })

  it('opens the shared sidebar account menu outside the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/files')

    await user.click(await screen.findByRole('button', { name: /arthur santos/i }))

    expect(await screen.findByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Meu perfil' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Configurações' })).toBeInTheDocument()
  })

  it('navigates into folders in files without breaking the breadcrumb', async () => {
    const user = userEvent.setup()

    renderApp('/files')

    await user.dblClick(await screen.findByText('Design do Produto'))

    expect(await screen.findByRole('button', { name: 'Design do Produto' })).toBeInTheDocument()
    expect(screen.getByText('Componentes')).toBeInTheDocument()
    expect(screen.getByText('Ícones')).toBeInTheDocument()
    expect(screen.getByText('6 itens')).toBeInTheDocument()
  })

  it('creates a new plan from the workspace', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await user.click((await screen.findAllByRole('button', { name: /novo plano/i }))[0])

    expect(await screen.findByRole('dialog', { name: 'Criar novo plano' })).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /título do plano/i }), 'Plano Frontend QA')
    await user.click(screen.getByRole('button', { name: 'Criar' }))

    expect(await screen.findAllByText('Plano Frontend QA')).not.toHaveLength(0)
    expect(screen.getByText('Atual')).toBeInTheDocument()
  })

  it('keeps the sidebar collapsed state across product screens', async () => {
    const user = userEvent.setup()

    renderApp('/workspace')

    await user.click(await screen.findByRole('button', { name: /recolher barra lateral/i }))
    await user.click(await screen.findByRole('button', { name: /abrir quadro/i }))

    expect(await screen.findByText('Adicionar lista')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expandir barra lateral/i })).toBeInTheDocument()
  })
})
