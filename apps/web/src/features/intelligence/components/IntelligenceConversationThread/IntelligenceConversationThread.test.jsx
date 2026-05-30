import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import IntelligenceConversationThread from './IntelligenceConversationThread.jsx'
import styles from './IntelligenceConversationThread.module.css'

describe('IntelligenceConversationThread', () => {
  it('returns null when there is no content to render', () => {
    const { container } = render(<IntelligenceConversationThread messages={[]} isThinking={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('uses default message classes when custom classes are not provided', () => {
    render(
      <IntelligenceConversationThread
        messages={[
          { id: 'u1', role: 'user', text: 'Mensagem do usuário' },
          { id: 'a1', role: 'assistant', text: 'Resposta do assistente', status: 'COMPLETED' },
        ]}
        isThinking
      />,
    )

    const userBubble = screen.getByText('Mensagem do usuário')
    const assistantMessage = screen.getByText('Resposta do assistente')
    const thinkingMessage = screen.getByText('Pensando...')

    expect(userBubble).toHaveClass(styles.messageUser)
    expect(assistantMessage).toHaveClass(styles.messageAssistant)
    expect(thinkingMessage).toHaveClass(styles.thinking)
  })

  it('derives assistant content from canonical message shape and renders pending placeholders inline', () => {
    render(
      <IntelligenceConversationThread
        messages={[
          {
            id: 'a1',
            role: 'assistant',
            status: 'PENDING',
            text: '',
            contentText: '',
            blocks: [],
          },
          {
            id: 'a2',
            role: 'assistant',
            status: 'COMPLETED',
            text: '',
            contentText: '',
            blocks: [{
              id: 'block-1',
              type: 'MARKDOWN',
              position: 0,
              payload: { markdown: 'Resposta em bloco' },
            }],
          },
        ]}
        isThinking={false}
      />,
    )

    expect(screen.getByText('Pensando...')).toHaveClass(styles.messageAssistant)
    expect(screen.getByTestId('ai-block-renderer')).toBeInTheDocument()
    expect(screen.getByText('Resposta em bloco')).toBeInTheDocument()
  })

  it('renders tool execution as inline expandable artifact instead of a message block', async () => {
    const user = userEvent.setup()

    render(
      <IntelligenceConversationThread
        messages={[{
          id: 'a3',
          role: 'assistant',
          status: 'COMPLETED',
          text: '',
          contentText: '',
          inlineArtifacts: [{
            id: 'inline-1',
            type: 'TOOL_STATUS',
            position: 0,
            label: 'workspace.get_summary',
            status: 'completed',
            detail: 'Resumo do workspace carregado (mock).',
            payload: {
              title: 'Ferramenta: workspace.get_summary',
              note: 'Simulação — nenhuma ferramenta foi executada no servidor.',
            },
          }],
          blocks: [{
            id: 'block-2',
            type: 'PLAN_PROPOSAL',
            position: 1,
            title: 'Criar plano',
            payload: { preview: { title: 'Plano Demo' } },
          }],
        }]}
        isThinking={false}
      />,
    )

    expect(
      screen.getByRole('button', { name: /Ferramenta \| workspace\.get_summary \| concluída/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Resumo do workspace carregado (mock).')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ferramenta/i }))

    expect(screen.getByText('Resumo do workspace carregado (mock).')).toBeInTheDocument()
    expect(screen.getByText('Simulação — nenhuma ferramenta foi executada no servidor.')).toBeInTheDocument()
  })
})
