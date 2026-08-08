function commonSuffixLength(a, b) {
  let length = 0
  const limit = Math.min(a.length, b.length)
  for (let index = 1; index <= limit; index += 1) {
    if (a[a.length - index] !== b[b.length - index]) break
    length = index
  }
  return length
}

function commonPrefixLength(a, b) {
  let length = 0
  const limit = Math.min(a.length, b.length)
  while (length < limit && a[length] === b[length]) length += 1
  return length
}

export function isCommentAnchored(content = '', comment) {
  const quote = comment?.quotedText
  const { selectionStart, selectionEnd } = comment ?? {}
  if (!quote || selectionStart == null || selectionEnd == null) return false
  if (selectionStart < 0 || selectionEnd <= selectionStart) return false
  return content.slice(selectionStart, selectionEnd) === quote
}

export function getQuoteOccurrenceIndex(content = '', quote = '', selectionStart = 0) {
  if (!quote || selectionStart < 0) return -1
  if (content.slice(selectionStart, selectionStart + quote.length) !== quote) return -1

  let occurrence = 0
  let pos = 0
  while (pos < selectionStart) {
    const index = content.indexOf(quote, pos)
    if (index < 0 || index >= selectionStart) break
    occurrence += 1
    pos = index + 1
  }
  return occurrence
}

export function findQuoteTopAtOccurrence(editorRoot, composerMain, quote, occurrenceIndex) {
  if (!editorRoot || !composerMain || !quote?.trim() || occurrenceIndex < 0) return null

  let seen = 0
  const walker = document.createTreeWalker(editorRoot, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    let fromIndex = 0
    while (fromIndex < node.textContent.length) {
      const index = node.textContent.indexOf(quote, fromIndex)
      if (index < 0) break
      if (seen === occurrenceIndex) {
        const range = document.createRange()
        range.setStart(node, index)
        range.setEnd(node, Math.min(index + quote.length, node.textContent.length))
        const rect = range.getBoundingClientRect()
        return rect.top - composerMain.getBoundingClientRect().top
      }
      seen += 1
      fromIndex = index + 1
    }
    node = walker.nextNode()
  }
  return null
}

export function resolveMarkdownSelection(editor, from, to) {
  if (!editor) return null

  const markdown = editor.getMarkdown()
  const quote = editor.state.doc.textBetween(from, to, ' ')
  if (!quote) return null

  const docSize = editor.state.doc.content.size
  const contextBefore = editor.state.doc.textBetween(Math.max(0, from - 48), from, ' ')
  const contextAfter = editor.state.doc.textBetween(to, Math.min(docSize, to + 48), ' ')

  let best = null
  let searchFrom = 0
  while (searchFrom <= markdown.length) {
    const index = markdown.indexOf(quote, searchFrom)
    if (index < 0) break

    const mdBefore = markdown.slice(Math.max(0, index - 48), index)
    const mdAfter = markdown.slice(index + quote.length, index + quote.length + 48)
    const score = commonSuffixLength(contextBefore, mdBefore)
      + commonPrefixLength(contextAfter, mdAfter)

    if (!best || score > best.score) {
      best = {
        selectionStart: index,
        selectionEnd: index + quote.length,
        score,
      }
    }
    searchFrom = index + 1
  }

  return best
}

export function filterAnchoredComments(content = '', comments = []) {
  return comments.filter((comment) => isCommentAnchored(content, comment))
}
