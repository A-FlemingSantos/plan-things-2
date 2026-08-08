const MARKDOWN_SIGNALS = [
  /^#{1,6}\s+\S/m,
  /^```/m,
  /^>\s+\S/m,
  /^(-{3,}|\*{3,}|_{3,})\s*$/m,
  /^\s*[-*+]\s+\S/m,
  /^\s*\d+\.\s+\S/m,
  /\[[^\]]+\]\([^)\s]+\)/,
  /(\*\*[^*\n]+\*\*|__[^_\n]+__)/,
  /(`[^`\n]+`)/,
]

export function looksLikeMarkdown(text = '') {
  const value = String(text).replace(/^\uFEFF/, '').trim()
  if (!value) return false

  let hits = 0
  for (const pattern of MARKDOWN_SIGNALS) {
    if (pattern.test(value)) hits += 1
  }
  if (hits >= 2) return true

  if (/^#{1,6}\s+\S/m.test(value)) return true
  if (/^```/m.test(value)) return true
  if (/\[[^\]]+\]\([^)\s]+\)/.test(value)) return true
  if (/^>\s+\S/m.test(value)) return true
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/m.test(value)) return true
  if (/^\s*[-*+]\s+\S/m.test(value) && value.includes('\n')) return true
  if (/^\s*\d+\.\s+\S/m.test(value) && value.includes('\n')) return true
  if (/(\*\*[^*\n]+\*\*|__[^_\n]+__)/.test(value) && (value.includes('\n') || /^\*\*[^*\n]+\*\*$/.test(value) || /^__[^_\n]+__$/.test(value))) {
    return true
  }
  return false
}

export function insertMarkdownContent(editor, markdown) {
  if (!editor || markdown == null) return false
  const text = String(markdown)
  if (!text) return false

  const { from, to } = editor.state.selection
  return editor
    .chain()
    .focus()
    .insertContentAt({ from, to }, text, { contentType: 'markdown' })
    .run()
}

export function handleMarkdownPaste(editor, event) {
  if (!editor || editor.isDestroyed) return false
  const text = event.clipboardData?.getData('text/plain')
  if (!text || !looksLikeMarkdown(text)) return false

  event.preventDefault()
  return insertMarkdownContent(editor, text)
}
