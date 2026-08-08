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
})
