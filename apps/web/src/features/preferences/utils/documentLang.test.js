import { describe, expect, it } from 'vitest'
import { resolveDocumentLang } from './documentLang.js'

describe('resolveDocumentLang', () => {
  it('defaults to Brazilian Portuguese', () => {
    expect(resolveDocumentLang()).toBe('pt-BR')
    expect(resolveDocumentLang('')).toBe('pt-BR')
    expect(resolveDocumentLang(null)).toBe('pt-BR')
  })

  it('resolves Portuguese and English preference tags', () => {
    expect(resolveDocumentLang('pt-BR')).toBe('pt-BR')
    expect(resolveDocumentLang('pt')).toBe('pt-BR')
    expect(resolveDocumentLang('en-US')).toBe('en-US')
    expect(resolveDocumentLang('en')).toBe('en-US')
  })
})
