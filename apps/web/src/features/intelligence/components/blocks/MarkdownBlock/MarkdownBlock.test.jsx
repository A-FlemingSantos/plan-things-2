import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MarkdownBlock from './MarkdownBlock.jsx'

vi.mock('streamdown', () => ({
  Streamdown: ({ children, mode, animated, isAnimating }) => (
    <div
      data-testid="streamdown-renderer"
      data-mode={mode}
      data-animated={String(animated)}
      data-is-animating={String(isAnimating)}
    >
      {children}
    </div>
  ),
}))

describe('MarkdownBlock', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses react-markdown fallback when streamdown flag is disabled', () => {
    vi.stubEnv('VITE_INTELLIGENCE_STREAMDOWN', 'false')

    render(<MarkdownBlock markdown="**Olá** mundo" />)

    expect(screen.queryByTestId('streamdown-renderer')).not.toBeInTheDocument()
    expect(screen.getByText('Olá')).toBeInTheDocument()
    expect(screen.getByText('mundo')).toBeInTheDocument()
  })

  it('uses streamdown in streaming mode while message is streaming', () => {
    vi.stubEnv('VITE_INTELLIGENCE_STREAMDOWN', 'true')

    render(<MarkdownBlock markdown="Conteúdo parcial" isStreaming />)

    const streamdown = screen.getByTestId('streamdown-renderer')
    expect(streamdown).toHaveAttribute('data-mode', 'streaming')
    expect(streamdown).toHaveAttribute('data-animated', 'true')
    expect(streamdown).toHaveAttribute('data-is-animating', 'true')
    expect(streamdown).toHaveTextContent('Conteúdo parcial')
  })

  it('uses streamdown in static mode when message is completed', () => {
    vi.stubEnv('VITE_INTELLIGENCE_STREAMDOWN', 'true')

    render(<MarkdownBlock markdown="Conteúdo final" isStreaming={false} />)

    const streamdown = screen.getByTestId('streamdown-renderer')
    expect(streamdown).toHaveAttribute('data-mode', 'static')
    expect(streamdown).toHaveAttribute('data-animated', 'true')
    expect(streamdown).toHaveAttribute('data-is-animating', 'false')
    expect(streamdown).toHaveTextContent('Conteúdo final')
  })
})
