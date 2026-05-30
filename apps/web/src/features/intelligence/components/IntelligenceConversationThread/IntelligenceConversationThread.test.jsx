import { render, screen } from '@testing-library/react'
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
    expect(screen.getByText('Resposta em bloco')).toHaveClass(styles.messageAssistant)
  })
})
