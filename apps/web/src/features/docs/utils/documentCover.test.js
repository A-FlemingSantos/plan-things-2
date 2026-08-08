import { describe, expect, it } from 'vitest'
import {
  hasDocumentCover,
  isAuthenticatedDocumentCoverUrl,
  resolveDocumentCoverUrl,
} from './documentCover.js'

describe('resolveDocumentCoverUrl', () => {
  it('resolves uploaded file covers', () => {
    expect(resolveDocumentCoverUrl('files/abc-123')).toBe('/api/files/abc-123/download')
  })

  it('returns external urls unchanged', () => {
    expect(resolveDocumentCoverUrl('https://images.unsplash.com/photo-1')).toBe(
      'https://images.unsplash.com/photo-1',
    )
  })
})

describe('isAuthenticatedDocumentCoverUrl', () => {
  it('detects authenticated file urls', () => {
    expect(isAuthenticatedDocumentCoverUrl('/api/files/abc/download')).toBe(true)
    expect(isAuthenticatedDocumentCoverUrl('https://example.com/a.jpg')).toBe(false)
  })
})

describe('hasDocumentCover', () => {
  it('returns false when cover is missing', () => {
    expect(hasDocumentCover(null)).toBe(false)
    expect(hasDocumentCover('')).toBe(false)
  })

  it('returns true for uploaded and external covers', () => {
    expect(hasDocumentCover('files/abc-123')).toBe(true)
    expect(hasDocumentCover('https://images.unsplash.com/photo-1')).toBe(true)
  })
})
