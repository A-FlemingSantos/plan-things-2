import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MarkdownContent from './MarkdownContent.jsx'

const styles = {
  markdownContent: 'markdownContent',
  bodyHeading: 'bodyHeading',
  bodyText: 'bodyText',
  figure: 'figure',
  markdownImage: 'markdownImage',
}

describe('MarkdownContent', () => {
  it('renders sanitized GFM Markdown as document content', () => {
    render(
      <MarkdownContent
        styles={styles}
        value={'## Plano\n\n**Decisão**\n\n- [x] Persistir em Markdown'}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Plano' })).toBeInTheDocument()
    expect(screen.getByText('Decisão')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('renders headings, links, lists, and code blocks', () => {
    const { container } = render(
      <MarkdownContent
        styles={styles}
        value={[
          '# Título',
          '',
          'Parágrafo com [link](https://example.com).',
          '',
          '- Item um',
          '- Item dois',
          '',
          '1. Numerado',
          '',
          '```',
          'codigo',
          '```',
        ].join('\n')}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Título' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'link' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(container.querySelector('ul')).not.toBeNull()
    expect(container.querySelector('ol')).not.toBeNull()
    expect(container.querySelector('pre code')).toHaveTextContent('codigo')
  })
})
