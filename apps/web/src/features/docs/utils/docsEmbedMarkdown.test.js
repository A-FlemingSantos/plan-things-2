import { describe, expect, it } from 'vitest'
import {
  normalizeDocsEmbedMarkdown,
  parseEmbedPayload,
  serializeEmbedPayload,
  splitDocsEmbedMarkdown,
  youtubeEmbedUrl,
} from './docsEmbedMarkdown.js'

describe('parseEmbedPayload', () => {
  it('parses selected url payloads', () => {
    expect(parseEmbedPayload('unsplash', 'url=https%3A%2F%2Fexample.com%2Fa.jpg')).toEqual({
      kind: 'unsplash',
      mode: 'selected',
      url: 'https://example.com/a.jpg',
      query: '',
      page: 1,
      pageToken: '',
    })
  })

  it('parses search payloads', () => {
    expect(parseEmbedPayload('video', 'q=nature&pageToken=abc123')).toEqual({
      kind: 'video',
      mode: 'search',
      url: '',
      query: 'nature',
      page: 1,
      pageToken: 'abc123',
    })
  })
})

describe('serializeEmbedPayload', () => {
  it('serializes search and selected states', () => {
    expect(serializeEmbedPayload({
      kind: 'unsplash',
      query: 'Landscape',
      page: 2,
      url: '',
      pageToken: '',
    })).toBe('[[embed:unsplash?q=Landscape&page=2]]')

    expect(serializeEmbedPayload({
      kind: 'video',
      url: 'https://www.youtube.com/watch?v=abc',
      query: '',
      page: 1,
      pageToken: '',
    })).toBe('[[embed:video?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc]]')
  })
})

describe('normalizeDocsEmbedMarkdown', () => {
  it('converts legacy Unsplash and video lines into embed tokens', () => {
    const markdown = '[Unsplash] https://images.unsplash.com/photo-1\n[Vídeo] Landscape'
    expect(normalizeDocsEmbedMarkdown(markdown)).toBe(
      '[[embed:unsplash?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1]]\n[[embed:video?q=Landscape]]',
    )
  })
})

describe('splitDocsEmbedMarkdown', () => {
  it('splits markdown around embed tokens', () => {
    const parts = splitDocsEmbedMarkdown('Intro\n[[embed:unsplash?q=Landscape&page=1]]\nOutro')
    expect(parts).toEqual([
      { type: 'markdown', content: 'Intro\n' },
      {
        type: 'embed',
        kind: 'unsplash',
        mode: 'search',
        url: '',
        query: 'Landscape',
        page: 1,
        pageToken: '',
      },
      { type: 'markdown', content: '\nOutro' },
    ])
  })
})

describe('youtubeEmbedUrl', () => {
  it('normalizes common YouTube URLs', () => {
    expect(youtubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    )
    expect(youtubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    )
  })
})
