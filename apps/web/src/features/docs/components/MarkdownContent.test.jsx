import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import MarkdownContent from './MarkdownContent.jsx'

const styles = {
  markdownContent: 'markdownContent',
  bodyHeading: 'bodyHeading',
  bodyText: 'bodyText',
  figure: 'figure',
  markdownImage: 'markdownImage',
}

const DOC_ID = '338352ef-a458-457a-92b7-f21755b2e637'

function renderMarkdown(value) {
  return render(
    <MemoryRouter>
      <MarkdownContent styles={styles} value={value} />
    </MemoryRouter>,
  )
}

describe('MarkdownContent', () => {
  it('renders sanitized GFM Markdown as document content', () => {
    renderMarkdown('## Plano\n\n**Decisão**\n\n- [x] Persistir em Markdown')

    expect(screen.getByRole('heading', { name: 'Plano' })).toBeInTheDocument()
    expect(screen.getByText('Decisão')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('renders headings, links, lists, and code blocks', () => {
    const { container } = renderMarkdown([
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
    ].join('\n'))

    expect(screen.getByRole('heading', { level: 1, name: 'Título' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'link' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(container.querySelector('ul')).not.toBeNull()
    expect(container.querySelector('ol')).not.toBeNull()
    expect(container.querySelector('pre code')).toHaveTextContent('codigo')
  })

  it('navigates internal docs links in-app without opening a new tab', () => {
    renderMarkdown(`Veja [outro doc](/docs/${DOC_ID}).`)

    const link = screen.getByRole('link', { name: 'outro doc' })
    expect(link).toHaveAttribute('href', `/docs/${DOC_ID}`)
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  it('keeps absolute internal docs urls as in-app links', () => {
    renderMarkdown(`Veja [outro doc](https://app.example.com/docs/${DOC_ID}).`)

    const link = screen.getByRole('link', { name: 'outro doc' })
    expect(link).toHaveAttribute('href', `/docs/${DOC_ID}`)
    expect(link).not.toHaveAttribute('target')
  })
})
