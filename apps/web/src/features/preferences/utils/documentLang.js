const DEFAULT_DOCUMENT_LANG = 'pt-BR'

/**
 * Map app language preferences to BCP 47 tags used for document + editor
 * spellcheck (pt-BR and en-US are the supported Settings options).
 */
export function resolveDocumentLang(language) {
  const value = typeof language === 'string' ? language.trim() : ''
  if (!value) return DEFAULT_DOCUMENT_LANG

  const lower = value.toLowerCase()
  if (lower === 'en' || lower.startsWith('en-')) return 'en-US'
  if (lower === 'pt' || lower.startsWith('pt-')) return 'pt-BR'

  try {
    return Intl.getCanonicalLocales(value)[0] ?? DEFAULT_DOCUMENT_LANG
  } catch {
    return DEFAULT_DOCUMENT_LANG
  }
}

export function applyDocumentLang(language) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = resolveDocumentLang(language)
}
