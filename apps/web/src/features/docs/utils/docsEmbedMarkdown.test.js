import { describe, expect, it } from 'vitest'
import {
  normalizeDocsEmbedMarkdown,
  splitDocsEmbedMarkdown,
  youtubeEmbedUrl,
} from './docsEmbedMarkdown.js'

describe('normalizeDocsEmbedMarkdown', () => {
  it('converts legacy Unsplash and video lines into embed tokens', () => {
    const markdown = '[Unsplash] https://images.unsplash.com/photo-1\n[Vídeo] https://youtu.be/abc123'
    expect(normalizeDocsEmbedMarkdown(markdown)).toBe(
      '[[embed:unsplash:https://images.unsplash.com/photo-1]]\n[[embed:video:https://youtu.be/abc123]]',
    )
  })
})

describe('splitDocsEmbedMarkdown', () => {
  it('splits markdown around embed tokens', () => {
    const parts = splitDocsEmbedMarkdown('Intro\n[[embed:unsplash:https://example.com/a.jpg]]\nOutro')
    expect(parts).toEqual([
      { type: 'markdown', content: 'Intro\n' },
      { type: 'embed', kind: 'unsplash', url: 'https://example.com/a.jpg' },
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
