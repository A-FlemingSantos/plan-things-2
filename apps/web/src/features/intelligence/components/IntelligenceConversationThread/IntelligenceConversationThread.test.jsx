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
          { id: 'a1', role: 'assistant', text: 'Resposta do assistente' },
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
})
