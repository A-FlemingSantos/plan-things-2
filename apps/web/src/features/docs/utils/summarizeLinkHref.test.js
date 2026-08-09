import { describe, expect, it } from 'vitest'
import { summarizeLinkHref } from './summarizeLinkHref.js'

const DOC_ID = '338352ef-a458-457a-92b7-f21755b2e637'

describe('summarizeLinkHref', () => {
  it('uses document title for internal docs links', () => {
    expect(summarizeLinkHref(`/docs/${DOC_ID}`, {
      documents: [{ id: DOC_ID, title: 'Orange Color' }],
    })).toBe('Orange Color')
  })

  it('falls back to Documento when title is unknown', () => {
    expect(summarizeLinkHref(`/docs/${DOC_ID}`)).toBe('Documento')
  })

  it('summarizes web urls to host and path', () => {
    expect(summarizeLinkHref('https://www.example.com/docs/guide')).toBe('example.com/docs/guide')
  })

  it('truncates long summaries', () => {
    const href = 'https://example.com/very/long/path/that/should/be/truncated/for-display'
    const summary = summarizeLinkHref(href)
    expect(summary.endsWith('…')).toBe(true)
    expect(summary.length).toBeLessThanOrEqual(42)
  })
})
