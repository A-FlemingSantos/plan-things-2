import { describe, expect, it } from 'vitest'
import { documentIdFromHref, extractLinkedDocIds } from './extractLinkedDocIds.js'

const DOC_A = '338352ef-a458-457a-92b7-f21755b2e637'
const DOC_B = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'
const DOC_C = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff'

describe('documentIdFromHref', () => {
  it('parses relative and absolute docs paths', () => {
    expect(documentIdFromHref(`/docs/${DOC_A}`)).toBe(DOC_A)
    expect(documentIdFromHref(`https://app.example.com/docs/${DOC_A}`)).toBe(DOC_A)
    expect(documentIdFromHref(`</docs/${DOC_A}>`)).toBe(DOC_A)
  })

  it('rejects non-doc hrefs', () => {
    expect(documentIdFromHref('https://example.com')).toBeNull()
    expect(documentIdFromHref('/workspace/board')).toBeNull()
    expect(documentIdFromHref(`/api/files/${DOC_A}/download`)).toBeNull()
    expect(documentIdFromHref('/docs/spark')).toBeNull()
  })
})

describe('extractLinkedDocIds', () => {
  it('extracts markdown links in first-seen order and dedupes', () => {
    const markdown = [
      `See [Alpha](/docs/${DOC_A}) and [Beta](/docs/${DOC_B}).`,
      `Again [Alpha](https://app.local/docs/${DOC_A}).`,
      `Also [titled](/docs/${DOC_C} "Title").`,
    ].join('\n')

    expect(extractLinkedDocIds(markdown)).toEqual([DOC_A, DOC_B, DOC_C])
  })

  it('includes bare and angle-bracket docs paths', () => {
    const markdown = `Path /docs/${DOC_A} and </docs/${DOC_B}>.`
    expect(extractLinkedDocIds(markdown)).toEqual([DOC_A, DOC_B])
  })

  it('excludes the current document id', () => {
    const markdown = `[Self](/docs/${DOC_A}) [Other](/docs/${DOC_B})`
    expect(extractLinkedDocIds(markdown, { excludeDocumentId: DOC_A })).toEqual([DOC_B])
  })

  it('ignores embed blocks and non-doc urls', () => {
    const markdown = [
      `[[embed:unsplash?url=https://images.unsplash.com/photo&mode=selected]]`,
      `[web](https://example.com)`,
      `[doc](/docs/${DOC_A})`,
      `[[embed:video?url=https://youtu.be/abc]]`,
    ].join('\n')

    expect(extractLinkedDocIds(markdown)).toEqual([DOC_A])
  })

  it('returns empty for blank content', () => {
    expect(extractLinkedDocIds('')).toEqual([])
    expect(extractLinkedDocIds(null)).toEqual([])
  })
})
