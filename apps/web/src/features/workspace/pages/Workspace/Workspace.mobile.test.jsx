import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Workspace from './Workspace.jsx'
import { installMatchMediaController } from '../../../../test/matchMedia.js'

const plansMock = vi.hoisted(() => ({
  plans: [
    {
      id: 'plan-1',
      name: 'Lancamento do Produto — Q3',
      description: '',
      tag: 'Design',
      tagColor: '#d4aef1',
      date: '18 ago',
      tasks: 18,
      members: ['#000'],
    },
  ],
  activePlan: null,
  createPlan: vi.fn(),
  deletePlan: vi.fn(),
  renamePlan: vi.fn(),
  updatePlanCover: vi.fn(),
  selectPlan: vi.fn(),
  currentUser: { fullName: 'Arthur Fleming' },
  isBackendDriven: false,
  isLoading: false,
}))

const preferencesMock = vi.hoisted(() => ({
  localPreferences: {
    confirmDestructiveActions: true,
    showIntelligenceSection: true,
  },
}))

vi.mock('../../context/PlansContext.jsx', () => ({
  usePlans: () => plansMock,
}))

vi.mock('../../../preferences/context/PreferencesContext.jsx', () => ({
  DEFAULT_LOCAL_PREFERENCES: {
    showIntelligenceSection: true,
  },
  usePreferences: () => preferencesMock,
}))

vi.mock('../../../../shared/hooks/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => ({
    activeNav: 'home',
    handleNavItemClick: vi.fn(),
  }),
}))

vi.mock('../../../../shared/components/ProductAppShell/ProductAppShell.jsx', () => ({
  default: ({ children, mobileTitle }) => (
    <div>
      <h1>{mobileTitle}</h1>
      {children}
    </div>
  ),
}))

vi.mock('../../../../shared/components/PlanSidebarSection/PlanSidebarSection.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../../shared/components/SidebarAccountMenu/SidebarAccountMenu.jsx', () => ({
  default: () => null,
}))

vi.mock('../../../preferences/components/AppThemeScope/AppThemeScope.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../components/InviteNotifications/InviteNotifications.jsx', () => ({
  default: () => <button type="button" aria-label="Notificações">Notificações</button>,
}))

function renderWorkspace() {
  return render(
    <MemoryRouter>
      <Workspace />
    </MemoryRouter>,
  )
}

describe('Workspace mobile layout', () => {
  beforeEach(() => {
    preferencesMock.localPreferences.showIntelligenceSection = true
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    })
  })

  it('keeps the mobile workspace controls available without hiding the primary actions', () => {
    installMatchMediaController(390)

    renderWorkspace()

    expect(screen.getByRole('region', { name: 'Seção do Intelligence' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /novo plano/i }).length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Buscar planos...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notificações' })).toBeInTheDocument()
    expect(screen.getByText('Todos os planos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visualização em grade' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Visualização em lista' })).toBeInTheDocument()
  })

  it('hides the intelligence section when the workspace preference is disabled', () => {
    preferencesMock.localPreferences.showIntelligenceSection = false

    renderWorkspace()

    expect(screen.queryByRole('region', { name: 'Seção do Intelligence' })).not.toBeInTheDocument()
    expect(screen.getByText('Todos os planos')).toBeInTheDocument()
  })

  it('sends workspace intelligence messages from typed prompts and suggestions', async () => {
    const user = userEvent.setup()

    renderWorkspace()

    await user.type(screen.getByLabelText('Prompt do Intelligence'), 'Preciso planejar um produto novo')
    await user.click(screen.getByRole('button', { name: 'Enviar prompt ao Intelligence' }))

    expect(screen.getByText('Preciso planejar um produto novo')).toBeInTheDocument()
    expect(await screen.findByText(/Eu começaria separando a ideia/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Criar pitch deck' }))

    expect(await screen.findByText('Crie uma estrutura de pitch deck para apresentar esta ideia.')).toBeInTheDocument()
    expect(await screen.findByText(/problema, público, insight/i)).toBeInTheDocument()
  })

  it('adds recognized voice input to the prompt only after stopping capture', async () => {
    const user = userEvent.setup()

    class MockSpeechRecognition {
      start() {
        this.onstart?.()
        const result = [{ transcript: 'Planejar lançamento por voz' }]
        result.isFinal = true
        this.onresult?.({ resultIndex: 0, results: [result] })
      }

      stop() {
        this.onend?.()
      }
      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))

    expect(screen.queryByDisplayValue('Planejar lançamento por voz')).not.toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Parar gravação de áudio para o Intelligence' }))

    expect(await screen.findByDisplayValue('Planejar lançamento por voz')).toBeInTheDocument()
    expect(screen.getByText('Texto de voz adicionado ao prompt.')).toBeInTheDocument()
  })

  it('allows repeated voice input attempts after a successful capture', async () => {
    const user = userEvent.setup()
    const transcripts = ['Primeira tentativa', 'Segunda tentativa']
    let startCount = 0

    class MockSpeechRecognition {
      start() {
        const transcript = transcripts[startCount]
        startCount += 1
        this.onstart?.()
        const result = [{ transcript }]
        result.isFinal = true
        this.onresult?.({ resultIndex: 0, results: [result] })
      }

      stop() {
        this.onend?.()
      }

      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))
    await user.click(await screen.findByRole('button', { name: 'Parar gravação de áudio para o Intelligence' }))
    expect(await screen.findByDisplayValue('Primeira tentativa')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))
    await user.click(await screen.findByRole('button', { name: 'Parar gravação de áudio para o Intelligence' }))

    expect(await screen.findByDisplayValue('Primeira tentativa Segunda tentativa')).toBeInTheDocument()
    expect(startCount).toBe(2)
  })

  it('uses speech resultIndex so repeated result events do not duplicate old transcript', async () => {
    const user = userEvent.setup()

    class MockSpeechRecognition {
      start() {
        this.onstart?.()

        const firstResult = [{ transcript: 'Primeiro trecho' }]
        firstResult.isFinal = true
        this.onresult?.({ resultIndex: 0, results: [firstResult] })

        const repeatedFirstResult = [{ transcript: 'Primeiro trecho' }]
        repeatedFirstResult.isFinal = true
        const secondResult = [{ transcript: 'Segundo trecho' }]
        secondResult.isFinal = true
        this.onresult?.({ resultIndex: 1, results: [repeatedFirstResult, secondResult] })
      }

      stop() {
        this.onend?.()
      }

      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))
    await user.click(await screen.findByRole('button', { name: 'Parar gravação de áudio para o Intelligence' }))

    expect(await screen.findByDisplayValue('Primeiro trecho Segundo trecho')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Primeiro trecho Primeiro trecho Segundo trecho')).not.toBeInTheDocument()
  })

  it('toggles the microphone selected state while voice capture is active', async () => {
    const user = userEvent.setup()
    const stop = vi.fn(function stop() {
      this.onend?.()
    })

    class MockSpeechRecognition {
      start() {
        this.onstart?.()
      }

      stop = stop
      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    const startButton = screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' })
    await user.click(startButton)

    const stopButton = await screen.findByRole('button', { name: 'Parar gravação de áudio para o Intelligence' })
    expect(stopButton).toHaveAttribute('aria-pressed', 'true')

    await user.click(stopButton)

    expect(stop).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Gravar áudio para o Intelligence' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Captura de voz interrompida.')).toBeInTheDocument()
  })

  it('shows a microphone permission message when voice access is blocked', async () => {
    const user = userEvent.setup()

    class MockSpeechRecognition {
      start() {
        this.onerror?.({ error: 'not-allowed' })
        this.onend?.()
      }

      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))

    expect(await screen.findByText('Permissão do microfone negada. Libere o acesso ao microfone no navegador.')).toBeInTheDocument()
  })

  it('keeps browser network errors from interrupting the active microphone state', async () => {
    const user = userEvent.setup()

    class MockSpeechRecognition {
      start() {
        this.onstart?.()
        this.onerror?.({ error: 'network' })
      }

      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))

    expect(await screen.findByRole('button', { name: 'Parar gravação de áudio para o Intelligence' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Ouvindo... clique no microfone para parar.')).toBeInTheDocument()
    expect(screen.queryByText('O reconhecimento de voz do navegador está indisponível. Tente Chrome/Edge com internet ou digite o prompt.')).not.toBeInTheDocument()
  })

  it('restarts browser voice capture when the browser ends after a network interruption', async () => {
    const user = userEvent.setup()
    let startCount = 0

    class MockSpeechRecognition {
      start() {
        startCount += 1
        this.onstart?.()
        if (startCount === 1) {
          this.onerror?.({ error: 'network' })
          this.onend?.()
        }
      }

      abort() {}
    }

    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    })

    renderWorkspace()

    await user.click(screen.getByRole('button', { name: 'Gravar áudio para o Intelligence' }))

    expect(await screen.findByRole('button', { name: 'Parar gravação de áudio para o Intelligence' })).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText('Ouvindo... clique no microfone para parar.')).toBeInTheDocument()
    await waitFor(() => expect(startCount).toBeGreaterThanOrEqual(2))
  })
})
