import { describe, expect, it, vi } from 'vitest'
import {
  handleMarkdownPaste,
  insertMarkdownContent,
  looksLikeMarkdown,
} from './markdownPaste.js'

describe('looksLikeMarkdown', () => {
  it('detects headings, links, lists, and fences', () => {
    expect(looksLikeMarkdown('# Título')).toBe(true)
    expect(looksLikeMarkdown('Veja [aqui](https://example.com)')).toBe(true)
    expect(looksLikeMarkdown('- um\n- dois')).toBe(true)
    expect(looksLikeMarkdown('1. um\n2. dois')).toBe(true)
    expect(looksLikeMarkdown('```\ncódigo\n```')).toBe(true)
    expect(looksLikeMarkdown('> citação')).toBe(true)
    expect(looksLikeMarkdown('---')).toBe(true)
    expect(looksLikeMarkdown('**negrito**')).toBe(true)
  })

  it('ignores plain prose', () => {
    expect(looksLikeMarkdown('Uma palavra leva à outra...')).toBe(false)
    expect(looksLikeMarkdown('Item - algo simples')).toBe(false)
    expect(looksLikeMarkdown('')).toBe(false)
  })
})

describe('insertMarkdownContent', () => {
  it('inserts clipboard text as markdown content type', () => {
    const run = vi.fn(() => true)
    const insertContentAt = vi.fn(() => ({ run }))
    const focus = vi.fn(() => ({ insertContentAt }))
    const chain = vi.fn(() => ({ focus }))
    const editor = {
      state: { selection: { from: 2, to: 5 } },
      chain,
    }

    expect(insertMarkdownContent(editor, '# Título\n\nTexto')).toBe(true)
    expect(insertContentAt).toHaveBeenCalledWith(
      { from: 2, to: 5 },
      '# Título\n\nTexto',
      { contentType: 'markdown' },
    )
  })
})

describe('handleMarkdownPaste', () => {
  it('prevents default and inserts when clipboard looks like markdown', () => {
    const run = vi.fn(() => true)
    const insertContentAt = vi.fn(() => ({ run }))
    const focus = vi.fn(() => ({ insertContentAt }))
    const editor = {
      isDestroyed: false,
      state: { selection: { from: 0, to: 0 } },
      chain: () => ({ focus }),
    }
    const event = {
      clipboardData: { getData: () => '# Título\n\n[link](https://example.com)' },
      preventDefault: vi.fn(),
    }

    expect(handleMarkdownPaste(editor, event)).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(insertContentAt).toHaveBeenCalled()
  })

  it('falls through for plain text', () => {
    const editor = {
      isDestroyed: false,
      state: { selection: { from: 0, to: 0 } },
      chain: vi.fn(),
    }
    const event = {
      clipboardData: { getData: () => 'texto simples' },
      preventDefault: vi.fn(),
    }

    expect(handleMarkdownPaste(editor, event)).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(editor.chain).not.toHaveBeenCalled()
  })
})
