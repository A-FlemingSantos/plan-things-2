import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Code2,
  Image,
  Link2,
  Lock,
  MessageSquareLock,
  Minus,
  Plus,
  Quote,
  Video,
} from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'

function UnsplashLogo({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" />
    </svg>
  )
}

const BLOCK_ACTIONS = [
  { id: 'image', label: 'Imagem', Icon: Image },
  { id: 'unsplash', label: 'Unsplash', Icon: UnsplashLogo },
  { id: 'video', label: 'Vídeo', Icon: Video },
  { id: 'quote', label: 'Adicionar citação', Icon: Quote },
  { id: 'code', label: 'Bloco de código', Icon: Code2 },
  { id: 'divider', label: 'Linha', Icon: Minus },
]

function splitLines(value) {
  return value.length === 0 ? [''] : value.split('\n')
}

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function autosize(node) {
  if (!node) return
  node.style.height = 'auto'
  node.style.height = `${Math.max(node.scrollHeight, 26)}px`
}

function blockInsertion(blockId) {
  switch (blockId) {
    case 'image': return ['[Imagem]']
    case 'unsplash': return ['[Unsplash]']
    case 'video': return ['[Vídeo]']
    case 'quote': return ['> ']
    case 'code': return ['```', '', '```']
    case 'divider': return ['---']
    default: return ['']
  }
}

function selectionAnchor(input) {
  if (!input || input.selectionStart === input.selectionEnd) return null
  const style = window.getComputedStyle(input)
  const rect = input.getBoundingClientRect()
  const mirror = document.createElement('div')
  const before = document.createElement('span')
  const selected = document.createElement('span')
  mirror.style.cssText = [
    'position:fixed', 'visibility:hidden', 'white-space:pre-wrap',
    'overflow-wrap:anywhere', 'word-break:break-word', 'pointer-events:none',
    `top:${rect.top}px`, `left:${rect.left}px`, `width:${rect.width}px`,
    `font:${style.font}`, `letter-spacing:${style.letterSpacing}`,
    `line-height:${style.lineHeight}`, `padding:${style.padding}`,
    `border:${style.border}`, `box-sizing:${style.boxSizing}`,
  ].join(';')
  before.textContent = input.value.slice(0, input.selectionStart)
  selected.textContent = input.value.slice(input.selectionStart, input.selectionEnd)
  mirror.append(before, selected)
  document.body.appendChild(mirror)
  const selectedRect = selected.getBoundingClientRect()
  mirror.remove()
  return {
    start: input.selectionStart,
    end: input.selectionEnd,
    top: selectedRect.top - 10,
    left: selectedRect.left + selectedRect.width / 2,
  }
}

function AnnotationMirror({ text, ranges, styles }) {
  if (ranges.length === 0) return <span>{text || '\u00a0'}</span>
  const parts = []
  let cursor = 0
  ranges.forEach((range) => {
    if (range.start > cursor) parts.push(<span key={`text-${cursor}`}>{text.slice(cursor, range.start)}</span>)
    parts.push(<mark key={range.id} className={styles.annotatedMark}>{text.slice(range.start, range.end)}</mark>)
    cursor = range.end
  })
  if (cursor < text.length) parts.push(<span key={`text-${cursor}`}>{text.slice(cursor)}</span>)
  return parts
}

function commentNotes(comments, value) {
  const lines = splitLines(value)
  return comments.flatMap((comment) => {
    const quote = comment.quotedText?.trim()
    const offset = quote ? value.indexOf(quote) : -1
    if (offset < 0) return []
    let remaining = offset
    const lineIndex = lines.findIndex((line) => {
      if (remaining <= line.length) return true
      remaining -= line.length + 1
      return false
    })
    if (lineIndex < 0 || remaining + quote.length > lines[lineIndex].length) return []
    return [{
      id: comment.id,
      body: comment.body,
      quote,
      lineIndex,
      start: remaining,
      end: remaining + quote.length,
      authorInitials: getInitials(comment.author?.fullName),
    }]
  })
}

export default function InlineMarkdownComposer({
  value,
  onChange,
  onAddComment,
  comments,
  placeholder,
  styles,
}) {
  const { currentUser } = useAuth()
  const lineRefs = useRef([])
  const rowRefs = useRef([])
  const railRef = useRef(null)
  const composerRef = useRef(null)
  const selectionToolbarRef = useRef(null)
  const noteDraftRef = useRef(null)
  const [focusedLine, setFocusedLine] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selection, setSelection] = useState(null)
  const [pendingNote, setPendingNote] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteOffsets, setNoteOffsets] = useState({})
  const lines = useMemo(() => splitLines(value), [value])
  const notes = useMemo(() => commentNotes(comments, value), [comments, value])
  const activeLineEmpty = focusedLine != null && lines[focusedLine] === ''

  const clearSelection = () => setSelection(null)
  const refreshNoteOffsets = () => {
    const nextOffsets = {}
    notes.forEach((note) => {
      const row = rowRefs.current[note.lineIndex]
      if (row) nextOffsets[note.id] = row.offsetTop
    })
    setNoteOffsets(nextOffsets)
  }

  useEffect(() => {
    lines.forEach((_, index) => autosize(lineRefs.current[index]))
    requestAnimationFrame(refreshNoteOffsets)
  }, [lines, notes])

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeMenu = (event) => {
      if (!railRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!activeLineEmpty) setMenuOpen(false)
  }, [activeLineEmpty])

  useEffect(() => {
    if (!selection) return undefined
    const clearOutside = (event) => {
      if (!selectionToolbarRef.current?.contains(event.target) && !composerRef.current?.contains(event.target)) {
        clearSelection()
      }
    }
    const clearOnEscape = (event) => {
      if (event.key === 'Escape') clearSelection()
    }
    document.addEventListener('pointerdown', clearOutside)
    document.addEventListener('keydown', clearOnEscape)
    return () => {
      document.removeEventListener('pointerdown', clearOutside)
      document.removeEventListener('keydown', clearOnEscape)
    }
  }, [selection])

  useEffect(() => {
    if (!pendingNote) return undefined
    requestAnimationFrame(() => noteDraftRef.current?.focus())
    const cancelOnEscape = (event) => {
      if (event.key === 'Escape') {
        setPendingNote(null)
        setNoteDraft('')
      }
    }
    document.addEventListener('keydown', cancelOnEscape)
    return () => document.removeEventListener('keydown', cancelOnEscape)
  }, [pendingNote])

  const focusLine = (index, caret = 'end') => {
    requestAnimationFrame(() => {
      const input = lineRefs.current[index]
      if (!input) return
      input.focus()
      const position = caret === 'start' ? 0 : input.value.length
      input.setSelectionRange(position, position)
      setFocusedLine(index)
    })
  }

  const syncSelection = (lineIndex) => {
    if (pendingNote) return
    const anchor = selectionAnchor(lineRefs.current[lineIndex])
    if (!anchor) {
      clearSelection()
      return
    }
    setSelection({ lineIndex, ...anchor })
    setMenuOpen(false)
  }

  const updateLine = (index, nextText) => {
    const nextLines = [...lines]
    nextLines[index] = nextText
    onChange(nextLines.join('\n'))
    setMenuOpen(false)
    clearSelection()
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const caret = event.currentTarget.selectionStart ?? lines[index].length
      const nextLines = [...lines]
      nextLines.splice(index, 1, lines[index].slice(0, caret), lines[index].slice(caret))
      onChange(nextLines.join('\n'))
      setMenuOpen(false)
      clearSelection()
      focusLine(index + 1, 'start')
      return
    }
    if (event.key === 'Backspace' && lines[index] === '' && index > 0) {
      event.preventDefault()
      onChange(lines.filter((_, lineIndex) => lineIndex !== index).join('\n'))
      focusLine(index - 1)
    }
  }

  const applyBlock = (blockId) => {
    if (focusedLine == null) return
    const insertion = blockInsertion(blockId)
    const nextLines = [...lines]
    nextLines.splice(focusedLine, 1, ...insertion)
    if (blockId !== 'quote' && nextLines[focusedLine + insertion.length] == null) nextLines.push('')
    onChange(nextLines.join('\n'))
    setMenuOpen(false)
    clearSelection()
    focusLine(blockId === 'code' ? focusedLine + 1 : focusedLine + insertion.length, 'start')
  }

  const applySelectionAction = (action) => {
    if (!selection) return
    const { lineIndex, start, end } = selection
    const line = lines[lineIndex]
    const selectedText = line.slice(start, end)
    if (!selectedText) return
    if (action === 'comment') {
      setPendingNote({ lineIndex, start, end, quote: selectedText })
      clearSelection()
      return
    }
    const wrappers = {
      bold: ['**', '**'],
      italic: ['*', '*'],
      link: ['[', '](url)'],
      title: ['# ', ''],
      subtitle: ['## ', ''],
      quote: ['> ', ''],
    }
    const [before, after] = wrappers[action]
    const nextLines = [...lines]
    nextLines[lineIndex] = `${line.slice(0, start)}${before}${selectedText}${after}${line.slice(end)}`
    onChange(nextLines.join('\n'))
    clearSelection()
    requestAnimationFrame(() => {
      const input = lineRefs.current[lineIndex]
      input?.focus()
      input?.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    })
  }

  const sendNote = async () => {
    if (!pendingNote || !noteDraft.trim()) return
    const selectionStart = lines.slice(0, pendingNote.lineIndex).reduce((length, line) => length + line.length + 1, 0) + pendingNote.start
    await onAddComment({
      body: noteDraft.trim(),
      quotedText: pendingNote.quote,
      selectionStart,
      selectionEnd: selectionStart + pendingNote.quote.length,
    })
    setPendingNote(null)
    setNoteDraft('')
  }

  const authorName = currentUser?.fullName?.trim() || 'Você'
  return (
    <div ref={composerRef} className={styles.composerShell}>
      <div className={styles.composerMain}>
        <div className={styles.composer} role="textbox" aria-label="Conteúdo do documento" aria-multiline="true">
          {selection ? (
            <div ref={selectionToolbarRef} className={styles.selectionToolbar} role="toolbar" aria-label="Formatação do texto" style={{ top: selection.top, left: selection.left }}>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolBold}`} title="Negrito" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('bold')}>B</button>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolItalic}`} title="Itálico" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('italic')}>i</button>
              <button type="button" className={styles.selectionToolButton} title="Inserir link" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('link')}><Link2 size={14} /></button>
              <span className={styles.selectionToolDivider} />
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolTitle}`} title="Título" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('title')}>T</button>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolSubtitle}`} title="Subtítulo" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('subtitle')}>T</button>
              <button type="button" className={styles.selectionToolButton} title="Citação" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('quote')}><Quote size={14} /></button>
              <span className={styles.selectionToolDivider} />
              <button type="button" className={styles.selectionToolButton} title="Adicionar comentário" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('comment')}><MessageSquareLock size={14} /></button>
            </div>
          ) : null}
          {lines.map((line, index) => {
            const ranges = notes.filter((note) => note.lineIndex === index)
            const isActiveEmpty = focusedLine === index && line === ''
            return (
              <div key={`composer-line-${index}`}>
                <div ref={(node) => { rowRefs.current[index] = node }} className={styles.composerRow}>
                  <div className={styles.composerRail} ref={isActiveEmpty ? railRef : undefined}>
                    {isActiveEmpty ? (
                      <div className={`${styles.blockInsert} ${menuOpen ? styles.blockInsertOpen : ''}`}>
                        <button type="button" className={styles.blockInsertButton} title={menuOpen ? 'Fechar' : 'Adicionar bloco'} aria-label={menuOpen ? 'Fechar opções de bloco' : 'Adicionar bloco'} aria-expanded={menuOpen} onMouseDown={(event) => event.preventDefault()} onClick={() => setMenuOpen((open) => !open)}><Plus size={14} /></button>
                        <div className={styles.blockActions} role="toolbar" aria-label="Inserir bloco" aria-hidden={!menuOpen}>
                          {BLOCK_ACTIONS.map(({ id, label, Icon }) => <button key={id} type="button" className={styles.blockActionButton} title={label} aria-label={label} tabIndex={menuOpen ? 0 : -1} onMouseDown={(event) => event.preventDefault()} onClick={() => applyBlock(id)}><Icon size={15} /></button>)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {ranges.length ? <div className={styles.lineMirror} aria-hidden="true"><AnnotationMirror text={line} ranges={ranges} styles={styles} /></div> : null}
                  <textarea
                    ref={(node) => { lineRefs.current[index] = node; autosize(node) }}
                    className={`${styles.bodyComposer} ${ranges.length ? styles.bodyComposerAnnotated : ''}`}
                    value={line}
                    rows={1}
                    onChange={(event) => updateLine(index, event.target.value)}
                    onFocus={() => setFocusedLine(index)}
                    onBlur={() => { setFocusedLine((current) => current === index ? null : current); setMenuOpen(false) }}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    onKeyUp={() => syncSelection(index)}
                    onMouseUp={() => syncSelection(index)}
                    onSelect={() => syncSelection(index)}
                    placeholder={index === 0 && lines.length === 1 && !line ? placeholder : undefined}
                    aria-label={index === 0 ? 'Conteúdo do documento' : `Linha ${index + 1}`}
                  />
                </div>
                {pendingNote?.lineIndex === index ? (
                  <div className={styles.noteComposer} role="dialog" aria-label="Comentários">
                    <div className={styles.noteComposerHeader}><span className={styles.noteComposerHeaderLabel}><Lock size={12} />Comentário</span></div>
                    <div className={styles.noteComposerBody}>
                      <div className={styles.noteComposerAuthor}><span className={styles.noteComposerAvatar}>{getInitials(authorName)}</span><span className={styles.noteComposerAuthorName}>{authorName}</span></div>
                      <textarea ref={noteDraftRef} className={styles.noteComposerInput} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Escreva um comentário..." aria-label="Escreva um comentário" rows={3} />
                      <div className={styles.noteComposerActions}><button type="button" className={styles.noteComposerSend} onClick={sendNote} disabled={!noteDraft.trim()}>Enviar</button><button type="button" className={styles.noteComposerCancel} onClick={() => { setPendingNote(null); setNoteDraft('') }}>Cancelar</button></div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <aside className={styles.commentsSection} aria-label="Comentários do documento">
        {notes.map((note) => <article key={note.id} className={styles.compactNote} style={{ top: noteOffsets[note.id] ?? 0 }} title={note.quote}><span className={styles.compactNoteAvatar}>{note.authorInitials}</span><p className={styles.compactNoteText}>{note.body}</p></article>)}
      </aside>
    </div>
  )
}
