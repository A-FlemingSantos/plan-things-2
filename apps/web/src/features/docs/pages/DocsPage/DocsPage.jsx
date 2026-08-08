import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Code2,
  Copy,
  Download,
  Image,
  Link2,
  Lock,
  MessageSquareLock,
  Minus,
  MoreHorizontal,
  MoveLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
  Quote,
  Search,
  Share,
  Trash2,
  Video,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import { buildDocsPath, ROUTES } from '../../../../shared/config/routes.js'
import { getSectionOffsetTop } from '../../../../shared/hooks/useSectionScrollIndicator.js'
import {
  DOCS_BLANK,
  DOCS_LIBRARY,
  findDocById,
  getDocCover,
  sectionDomId,
} from '../../data/docsContent.js'
import styles from './DocsPage.module.css'

function ContributorAvatar({ name, initials }) {
  return (
    <span className={styles.avatar} aria-hidden="true" title={name}>
      {initials}
    </span>
  )
}

function scrollViewportToSection(viewport, sectionId) {
  if (!viewport) return false

  const target = viewport.querySelector(`[data-doc-section="${sectionId}"]`)
  if (!target) return false

  const offsetTop = getSectionOffsetTop(viewport, target)
  viewport.scrollTo({
    top: Math.max(0, offsetTop - 20),
    behavior: 'smooth',
  })
  return true
}

function UnsplashLogo({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
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

function splitComposerLines(value) {
  return value.length === 0 ? [''] : value.split('\n')
}

function joinComposerLines(lines) {
  return lines.join('\n')
}

function measureInputSelectionAnchor(input) {
  if (!input) return null
  const start = input.selectionStart ?? 0
  const end = input.selectionEnd ?? 0
  if (start === end) return null

  const style = window.getComputedStyle(input)
  const inputRect = input.getBoundingClientRect()
  const mirror = document.createElement('div')
  const before = document.createElement('span')
  const selected = document.createElement('span')

  mirror.style.cssText = [
    'position:fixed',
    'visibility:hidden',
    'white-space:pre-wrap',
    'overflow-wrap:anywhere',
    'word-break:break-word',
    'pointer-events:none',
    `top:${inputRect.top}px`,
    `left:${inputRect.left}px`,
    `width:${inputRect.width}px`,
    `font:${style.font}`,
    `letter-spacing:${style.letterSpacing}`,
    `line-height:${style.lineHeight}`,
    `text-transform:${style.textTransform}`,
    `padding:${style.padding}`,
    `border:${style.border}`,
    `box-sizing:${style.boxSizing}`,
  ].join(';')

  before.textContent = input.value.slice(0, start)
  selected.textContent = input.value.slice(start, end) || '\u200b'
  mirror.append(before, selected)
  document.body.appendChild(mirror)

  const selectedRect = selected.getBoundingClientRect()
  const anchor = {
    top: selectedRect.top,
    left: selectedRect.left + selectedRect.width / 2,
    start,
    end,
  }
  mirror.remove()
  return anchor
}

function autosizeComposerField(node) {
  if (!node) return
  node.style.height = 'auto'
  node.style.height = `${Math.max(node.scrollHeight, 26)}px`
}

function blockInsertion(blockId) {
  switch (blockId) {
    case 'image':
      return ['[Imagem]']
    case 'unsplash':
      return ['[Unsplash]']
    case 'video':
      return ['[Vídeo]']
    case 'quote':
      return ['> ']
    case 'code':
      return ['```', '', '```']
    case 'divider':
      return ['---']
    default:
      return ['']
  }
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function collectLineRanges(lineIndex, notes, pendingNote) {
  const ranges = notes
    .filter((note) => note.lineIndex === lineIndex)
    .map((note) => ({ start: note.start, end: note.end, id: note.id }))

  if (
    pendingNote
    && pendingNote.lineIndex === lineIndex
    && pendingNote.end > pendingNote.start
  ) {
    ranges.push({
      start: pendingNote.start,
      end: pendingNote.end,
      id: 'pending',
    })
  }

  return ranges.sort((left, right) => left.start - right.start)
}

function AnnotatedLineMirror({ text, ranges }) {
  if (!text || ranges.length === 0) {
    return <span>{text || '\u00a0'}</span>
  }

  const parts = []
  let cursor = 0

  ranges.forEach((range, index) => {
    const start = Math.max(0, Math.min(range.start, text.length))
    const end = Math.max(start, Math.min(range.end, text.length))
    if (start > cursor) {
      parts.push(
        <span key={`text-${cursor}`}>{text.slice(cursor, start)}</span>,
      )
    }
    parts.push(
      <mark key={`mark-${range.id}-${index}`} className={styles.annotatedMark}>
        {text.slice(start, end) || '\u00a0'}
      </mark>,
    )
    cursor = end
  })

  if (cursor < text.length) {
    parts.push(<span key={`text-${cursor}`}>{text.slice(cursor)}</span>)
  }

  return parts
}

function DocsBodyComposer({ value, onChange, placeholder }) {
  const { currentUser } = useAuth()
  const authorName = currentUser?.fullName?.trim() || 'Você'
  const authorInitials = getInitials(authorName)

  const lineRefs = useRef([])
  const rowRefs = useRef([])
  const railRef = useRef(null)
  const selectionToolbarRef = useRef(null)
  const noteComposerRef = useRef(null)
  const composerRef = useRef(null)
  const composerMainRef = useRef(null)
  const noteDraftRef = useRef(null)

  const [focusedLine, setFocusedLine] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selection, setSelection] = useState(null)
  const [pendingNote, setPendingNote] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [notes, setNotes] = useState([])
  const [noteOffsets, setNoteOffsets] = useState({})

  const lines = useMemo(() => splitComposerLines(value), [value])
  const activeLineEmpty = focusedLine != null && (lines[focusedLine] ?? '').length === 0

  const clearSelectionToolbar = () => setSelection(null)

  const syncSelectionToolbar = (lineIndex) => {
    if (pendingNote) return
    const node = lineRefs.current[lineIndex]
    if (!node) {
      clearSelectionToolbar()
      return
    }
    const anchor = measureInputSelectionAnchor(node)
    if (!anchor) {
      clearSelectionToolbar()
      return
    }
    setSelection({
      lineIndex,
      start: anchor.start,
      end: anchor.end,
      top: anchor.top - 10,
      left: anchor.left,
    })
    setMenuOpen(false)
  }

  const refreshNoteOffsets = () => {
    const main = composerMainRef.current
    if (!main) return
    const mainTop = main.getBoundingClientRect().top
    const nextOffsets = {}
    notes.forEach((note) => {
      const row = rowRefs.current[note.lineIndex]
      if (!row) return
      nextOffsets[note.id] = row.getBoundingClientRect().top - mainTop
    })
    setNoteOffsets(nextOffsets)
  }

  useEffect(() => {
    lines.forEach((_, index) => {
      autosizeComposerField(lineRefs.current[index])
    })
    requestAnimationFrame(refreshNoteOffsets)
  }, [lines, value, notes])

  useEffect(() => {
    const annotationStillExists = (annotation) => {
      const line = lines[annotation.lineIndex]
      return typeof line === 'string'
        && line.slice(annotation.start, annotation.end) === annotation.quote
    }

    setNotes((current) => current.filter(annotationStillExists))

    if (pendingNote && !annotationStillExists(pendingNote)) {
      setPendingNote(null)
      setNoteDraft('')
    }
  }, [value])

  useEffect(() => {
    const onResize = () => refreshNoteOffsets()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [notes])

  useEffect(() => {
    if (!menuOpen) return undefined

    const onPointerDown = (event) => {
      if (railRef.current?.contains(event.target)) return
      setMenuOpen(false)
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!activeLineEmpty && menuOpen) setMenuOpen(false)
  }, [activeLineEmpty, menuOpen])

  useEffect(() => {
    if (!selection) return undefined

    const onPointerDown = (event) => {
      if (selectionToolbarRef.current?.contains(event.target)) return
      if (composerRef.current?.contains(event.target)) return
      clearSelectionToolbar()
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') clearSelectionToolbar()
    }

    const onScroll = () => {
      if (selection?.lineIndex == null) return
      syncSelectionToolbar(selection.lineIndex)
      refreshNoteOffsets()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [selection])

  useEffect(() => {
    if (!pendingNote) return undefined
    requestAnimationFrame(() => noteDraftRef.current?.focus())

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPendingNote(null)
        setNoteDraft('')
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [pendingNote])

  const focusLine = (index, caret = 'end') => {
    requestAnimationFrame(() => {
      const node = lineRefs.current[index]
      if (!node) return
      autosizeComposerField(node)
      node.focus()
      const position = caret === 'start' ? 0 : node.value.length
      node.setSelectionRange(position, position)
      setFocusedLine(index)
      clearSelectionToolbar()
      refreshNoteOffsets()
    })
  }

  const updateLine = (index, nextText) => {
    const nextLines = [...lines]
    nextLines[index] = nextText
    onChange(joinComposerLines(nextLines))
    setMenuOpen(false)
    clearSelectionToolbar()
    requestAnimationFrame(() => {
      autosizeComposerField(lineRefs.current[index])
      refreshNoteOffsets()
    })

    setNotes((current) => current.filter((note) => {
      if (note.lineIndex !== index) return true
      return nextText.slice(note.start, note.end) === note.quote
    }))

    if (
      pendingNote?.lineIndex === index
      && nextText.slice(pendingNote.start, pendingNote.end) !== pendingNote.quote
    ) {
      setPendingNote(null)
      setNoteDraft('')
    }
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const node = event.currentTarget
      const caret = node.selectionStart ?? node.value.length
      const before = node.value.slice(0, caret)
      const after = node.value.slice(caret)
      const nextLines = [...lines]
      nextLines[index] = before
      nextLines.splice(index + 1, 0, after)
      onChange(joinComposerLines(nextLines))
      setMenuOpen(false)
      clearSelectionToolbar()

      setNotes((current) => current.flatMap((note) => {
        if (note.lineIndex < index) return [note]
        if (note.lineIndex > index) {
          return [{ ...note, lineIndex: note.lineIndex + 1 }]
        }
        if (note.end <= caret) return [note]
        if (note.start >= caret) {
          return [{
            ...note,
            lineIndex: index + 1,
            start: note.start - caret,
            end: note.end - caret,
          }]
        }
        return []
      }))

      if (pendingNote?.lineIndex === index) {
        if (pendingNote.end <= caret) {
          // keep
        } else if (pendingNote.start >= caret) {
          setPendingNote({
            ...pendingNote,
            lineIndex: index + 1,
            start: pendingNote.start - caret,
            end: pendingNote.end - caret,
          })
        } else {
          setPendingNote(null)
          setNoteDraft('')
        }
      } else if (pendingNote && pendingNote.lineIndex > index) {
        setPendingNote({
          ...pendingNote,
          lineIndex: pendingNote.lineIndex + 1,
        })
      }

      focusLine(index + 1, 'start')
      return
    }

    if (event.key === 'Backspace' && lines[index] === '' && lines.length > 1 && index > 0) {
      event.preventDefault()
      const nextLines = lines.filter((_, lineIndex) => lineIndex !== index)
      onChange(joinComposerLines(nextLines))
      setMenuOpen(false)
      clearSelectionToolbar()
      setNotes((current) => current
        .filter((note) => note.lineIndex !== index)
        .map((note) => (
          note.lineIndex > index
            ? { ...note, lineIndex: note.lineIndex - 1 }
            : note
        )))
      if (pendingNote?.lineIndex === index) {
        setPendingNote(null)
        setNoteDraft('')
      } else if (pendingNote && pendingNote.lineIndex > index) {
        setPendingNote({
          ...pendingNote,
          lineIndex: pendingNote.lineIndex - 1,
        })
      }
      focusLine(index - 1, 'end')
    }
  }

  const applyBlock = (blockId) => {
    if (focusedLine == null) return
    const insertion = blockInsertion(blockId)
    const nextLines = [...lines]
    nextLines.splice(focusedLine, 1, ...insertion)
    if (blockId !== 'quote' && nextLines[focusedLine + insertion.length] == null) {
      nextLines.push('')
    }
    onChange(joinComposerLines(nextLines))
    setMenuOpen(false)
    clearSelectionToolbar()

    if (blockId === 'code') {
      focusLine(focusedLine + 1, 'start')
      return
    }
    if (blockId === 'quote') {
      focusLine(focusedLine, 'end')
      return
    }
    focusLine(focusedLine + insertion.length, 'start')
  }

  const openNoteComposer = (lineIndex, start, end, quote) => {
    setPendingNote({ lineIndex, start, end, quote })
    setNoteDraft('')
    clearSelectionToolbar()
    setMenuOpen(false)
  }

  const cancelNoteComposer = () => {
    setPendingNote(null)
    setNoteDraft('')
  }

  const sendNote = () => {
    if (!pendingNote) return
    const body = noteDraft.trim()
    if (!body) return

    setNotes((current) => [
      ...current,
      {
        id: `note-${Date.now()}`,
        lineIndex: pendingNote.lineIndex,
        start: pendingNote.start,
        end: pendingNote.end,
        quote: pendingNote.quote,
        body,
        authorName,
        authorInitials,
      },
    ])
    setPendingNote(null)
    setNoteDraft('')
    requestAnimationFrame(refreshNoteOffsets)
  }

  const applySelectionAction = (actionId) => {
    if (!selection) return
    const { lineIndex, start, end } = selection
    const line = lines[lineIndex] ?? ''
    const selectedText = line.slice(start, end)
    if (!selectedText) return

    let nextLine = line
    let nextStart = start
    let nextEnd = end

    if (actionId === 'bold') {
      nextLine = `${line.slice(0, start)}**${selectedText}**${line.slice(end)}`
      nextStart = start + 2
      nextEnd = nextStart + selectedText.length
    } else if (actionId === 'italic') {
      nextLine = `${line.slice(0, start)}*${selectedText}*${line.slice(end)}`
      nextStart = start + 1
      nextEnd = nextStart + selectedText.length
    } else if (actionId === 'link') {
      nextLine = `${line.slice(0, start)}[${selectedText}](url)${line.slice(end)}`
      nextStart = start + 1
      nextEnd = nextStart + selectedText.length
    } else if (actionId === 'title') {
      nextLine = `# ${selectedText}`
      nextStart = 2
      nextEnd = nextStart + selectedText.length
    } else if (actionId === 'subtitle') {
      nextLine = `## ${selectedText}`
      nextStart = 3
      nextEnd = nextStart + selectedText.length
    } else if (actionId === 'quote') {
      nextLine = `> ${selectedText}`
      nextStart = 2
      nextEnd = nextStart + selectedText.length
    } else if (actionId === 'comment') {
      openNoteComposer(lineIndex, start, end, selectedText)
      return
    }

    const nextLines = [...lines]
    nextLines[lineIndex] = nextLine
    onChange(joinComposerLines(nextLines))
    clearSelectionToolbar()

    requestAnimationFrame(() => {
      const node = lineRefs.current[lineIndex]
      if (!node) return
      node.focus()
      node.setSelectionRange(nextStart, nextEnd)
      setFocusedLine(lineIndex)
    })
  }

  return (
    <div ref={composerRef} className={styles.composerShell}>
      <div ref={composerMainRef} className={styles.composerMain}>
        <div
          className={styles.composer}
          role="textbox"
          aria-label="Conteúdo do documento"
          aria-multiline="true"
        >
          {selection ? (
            <div
              ref={selectionToolbarRef}
              className={styles.selectionToolbar}
              role="toolbar"
              aria-label="Formatação do texto"
              style={{ top: selection.top, left: selection.left }}
            >
              <button
                type="button"
                className={`${styles.selectionToolButton} ${styles.selectionToolBold}`}
                title="Negrito"
                aria-label="Negrito"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applySelectionAction('bold')}
              >
                B
              </button>
              <button
                type="button"
                className={`${styles.selectionToolButton} ${styles.selectionToolItalic}`}
                title="Itálico"
                aria-label="Itálico"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applySelectionAction('italic')}
              >
                i
              </button>
              <button
                type="button"
                className={styles.selectionToolButton}
                title="Inserir link"
                aria-label="Inserir link"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applySelectionAction('link')}
              >
                <Link2 size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <span className={styles.selectionToolDivider} aria-hidden="true" />
              <button
                type="button"
                className={`${styles.selectionToolButton} ${styles.selectionToolTitle}`}
                title="Título"
                aria-label="Título"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applySelectionAction('title')}
              >
                T
              </button>
              <button
                type="button"
                className={`${styles.selectionToolButton} ${styles.selectionToolSubtitle}`}
                title="Subtítulo"
                aria-label="Subtítulo"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applySelectionAction('subtitle')}
              >
                T
              </button>
              <button
                type="button"
                className={styles.selectionToolButton}
                title="Citação"
                aria-label="Citação"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applySelectionAction('quote')}
              >
                <Quote size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <span className={styles.selectionToolDivider} aria-hidden="true" />
              <button
                type="button"
                className={styles.selectionToolButton}
                title="Adicionar comentário"
                aria-label="Adicionar comentário"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applySelectionAction('comment')}
              >
                <MessageSquareLock size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {lines.map((line, index) => {
            const isActiveEmpty = focusedLine === index && line.length === 0
            const showPlaceholder = index === 0 && lines.length === 1 && line.length === 0
            const ranges = collectLineRanges(index, notes, pendingNote)
            const hasAnnotations = ranges.length > 0

            return (
              <div key={`composer-line-${index}`}>
                <div
                  ref={(node) => {
                    rowRefs.current[index] = node
                  }}
                  className={styles.composerRow}
                >
                  <div className={styles.composerRail} ref={isActiveEmpty ? railRef : undefined}>
                    {isActiveEmpty ? (
                      <div
                        className={`${styles.blockInsert} ${menuOpen ? styles.blockInsertOpen : ''}`}
                      >
                        <button
                          type="button"
                          className={styles.blockInsertButton}
                          title={menuOpen ? 'Fechar' : 'Adicionar bloco'}
                          aria-label={menuOpen ? 'Fechar opções de bloco' : 'Adicionar bloco'}
                          aria-expanded={menuOpen}
                          aria-controls={`docs-block-actions-${index}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setMenuOpen((open) => !open)}
                        >
                          <Plus size={14} strokeWidth={1.6} aria-hidden="true" />
                        </button>
                        <div
                          id={`docs-block-actions-${index}`}
                          className={styles.blockActions}
                          role="toolbar"
                          aria-label="Inserir bloco"
                          aria-hidden={!menuOpen}
                          {...(!menuOpen ? { inert: '' } : {})}
                        >
                          {BLOCK_ACTIONS.map(({ id, label, Icon }) => (
                            <button
                              key={id}
                              type="button"
                              className={styles.blockActionButton}
                              title={label}
                              aria-label={label}
                              tabIndex={menuOpen ? 0 : -1}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyBlock(id)}
                            >
                              <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {hasAnnotations ? (
                    <div className={styles.lineMirror} aria-hidden="true">
                      <AnnotatedLineMirror text={line} ranges={ranges} />
                    </div>
                  ) : null}

                  <textarea
                    ref={(node) => {
                      lineRefs.current[index] = node
                      autosizeComposerField(node)
                    }}
                    className={`${styles.bodyComposer} ${hasAnnotations ? styles.bodyComposerAnnotated : ''}`}
                    value={line}
                    rows={1}
                    onChange={(event) => updateLine(index, event.target.value)}
                    onFocus={() => setFocusedLine(index)}
                    onBlur={() => {
                      setFocusedLine((current) => (current === index ? null : current))
                      setMenuOpen(false)
                    }}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    onKeyUp={() => syncSelectionToolbar(index)}
                    onMouseUp={() => syncSelectionToolbar(index)}
                    onSelect={() => syncSelectionToolbar(index)}
                    placeholder={showPlaceholder ? placeholder : undefined}
                    aria-label={index === 0 ? 'Conteúdo do documento' : `Linha ${index + 1}`}
                  />
                </div>

                {pendingNote?.lineIndex === index ? (
                  <div
                    ref={noteComposerRef}
                    className={styles.noteComposer}
                    role="dialog"
                    aria-label="Notas privadas"
                  >
                    <div className={styles.noteComposerHeader}>
                      <span className={styles.noteComposerHeaderLabel}>
                        <Lock size={12} strokeWidth={1.8} aria-hidden="true" />
                        Notas privadas
                      </span>
                      <button
                        type="button"
                        className={styles.noteComposerHeaderAction}
                        title="Quem pode ver isto?"
                      >
                        Quem pode ver isto?
                      </button>
                    </div>
                    <div className={styles.noteComposerBody}>
                      <div className={styles.noteComposerAuthor}>
                        <span className={styles.noteComposerAvatar} aria-hidden="true">
                          {authorInitials}
                        </span>
                        <span className={styles.noteComposerAuthorName}>{authorName}</span>
                      </div>
                      <textarea
                        ref={noteDraftRef}
                        className={styles.noteComposerInput}
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Escreva uma nota..."
                        aria-label="Escreva uma nota"
                        rows={3}
                      />
                      <div className={styles.noteComposerActions}>
                        <button
                          type="button"
                          className={styles.noteComposerSend}
                          onClick={sendNote}
                          disabled={!noteDraft.trim()}
                        >
                          Enviar
                        </button>
                        <button
                          type="button"
                          className={styles.noteComposerCancel}
                          onClick={cancelNoteComposer}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <aside className={styles.commentsSection} aria-label="Comentários do documento">
        {notes.map((note) => (
          <article
            key={note.id}
            className={styles.compactNote}
            style={{ top: noteOffsets[note.id] ?? 0 }}
            title={note.body}
          >
            <span className={styles.compactNoteAvatar} aria-hidden="true">
              {note.authorInitials}
            </span>
            <p className={styles.compactNoteText}>{note.body}</p>
          </article>
        ))}
      </aside>
    </div>
  )
}

export default function DocsPage() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const activeDoc = findDocById(docId)

  const [activeSectionId, setActiveSectionId] = useState(
    () => activeDoc?.sections[0]?.id ?? '',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [indexOpen, setIndexOpen] = useState(true)
  const [docsOpen, setDocsOpen] = useState(true)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const articleViewportRef = useRef(null)
  const moreMenuRef = useRef(null)
  const titleInputRef = useRef(null)
  const isBlankDoc = activeDoc?.id === DOCS_BLANK.id

  useEffect(() => {
    if (!activeDoc) return
    setSearchQuery('')
    setActiveSectionId(activeDoc.sections[0]?.id ?? '')
    setMoreMenuOpen(false)
    if (activeDoc.id === DOCS_BLANK.id) {
      setDraftTitle('')
      setDraftDescription('')
      setDraftBody('')
      requestAnimationFrame(() => titleInputRef.current?.focus())
    }
    articleViewportRef.current?.scrollTo({ top: 0 })
  }, [activeDoc])

  useEffect(() => {
    if (!moreMenuOpen) return undefined

    const onPointerDown = (event) => {
      if (!moreMenuRef.current?.contains(event.target)) {
        setMoreMenuOpen(false)
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMoreMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [moreMenuOpen])

  const outline = useMemo(() => {
    if (!activeDoc) return []
    const query = searchQuery.trim().toLowerCase()
    if (!query) return activeDoc.sections

    return activeDoc.sections.filter((section) => {
      const haystack = [
        section.label,
        section.heading,
        ...(section.paragraphs ?? []),
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [activeDoc, searchQuery])

  useEffect(() => {
    if (outline.length === 0) return
    if (outline.some((section) => section.id === activeSectionId)) return
    setActiveSectionId(outline[0].id)
  }, [activeSectionId, outline])

  if (!activeDoc) {
    return <Navigate to={ROUTES.docs} replace />
  }

  const goToSection = (sectionId) => {
    setActiveSectionId(sectionId)

    const run = () => {
      scrollViewportToSection(articleViewportRef.current, sectionId)
    }

    requestAnimationFrame(run)
  }

  const openDoc = (nextDocId) => {
    if (nextDocId === activeDoc.id) return
    navigate(buildDocsPath(nextDocId))
  }

  const shareDoc = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : buildDocsPath(activeDoc.id)
    try {
      await navigator.clipboard?.writeText(url)
    } catch {
      // Mock surface — clipboard may be unavailable.
    }
  }

  const deleteDoc = () => {
    setMoreMenuOpen(false)
    navigate(ROUTES.docs)
  }

  const runMoreAction = async (actionId) => {
    setMoreMenuOpen(false)
    if (actionId === 'copy-link') {
      await shareDoc()
      return
    }
    if (actionId === 'delete') {
      deleteDoc()
    }
  }

  const layoutClassName = [
    styles.layout,
    indexOpen ? '' : styles.layoutIndexCollapsed,
  ].filter(Boolean).join(' ')

  return (
    <AppThemeScope>
      <ProductAppShell contentClassName={styles.page} contentTag="main">
        <div className={layoutClassName}>
          <aside
            id="docs-index-pane"
            className={`${styles.indexPane} ${indexOpen ? '' : styles.sidePaneCollapsed}`}
            aria-label="Índice do documento"
          >
            <div className={styles.paneHeader}>
              {indexOpen ? <p className={styles.indexLabel}>Índice</p> : null}
              <button
                type="button"
                className={styles.paneToggle}
                aria-label={indexOpen ? 'Ocultar índice' : 'Mostrar índice'}
                aria-controls="docs-index-pane"
                aria-expanded={indexOpen}
                onClick={() => setIndexOpen((open) => !open)}
              >
                {indexOpen ? (
                  <PanelLeftClose size={15} strokeWidth={1.6} aria-hidden="true" />
                ) : (
                  <PanelLeftOpen size={15} strokeWidth={1.6} aria-hidden="true" />
                )}
              </button>
            </div>
            <div
              className={styles.paneBody}
              aria-hidden={!indexOpen}
              {...(!indexOpen ? { inert: '' } : {})}
            >
              <nav className={styles.indexNav}>
                {outline.map((section) => {
                  const active = section.id === activeSectionId
                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={`${styles.indexItem} ${active ? styles.indexItemActive : ''}`}
                      aria-current={active ? 'location' : undefined}
                      onClick={() => goToSection(section.id)}
                    >
                      {section.label}
                    </button>
                  )
                })}
              </nav>
              {outline.length === 0 ? (
                <p className={styles.indexEmpty}>Nenhuma seção encontrada.</p>
              ) : null}
            </div>
          </aside>

          <section
            className={`${styles.articlePane} ${docsOpen ? '' : styles.articlePaneDocsCollapsed}`}
            aria-label="Documento"
          >
            <div className={styles.articleStage}>
              <CustomScrollArea
                className={styles.articleScroll}
                viewportClassName={styles.articleViewport}
                viewportRef={articleViewportRef}
                refreshKey={`docs:${activeDoc.id}:${indexOpen}:${docsOpen}`}
              >
                <div className={styles.articleInner}>
                  <header className={styles.toolbar}>
                    <div className={styles.toolbarLeading}>
                      <Link
                        to={ROUTES.docs}
                        className={styles.iconButton}
                        aria-label="Voltar para Docs"
                      >
                        <MoveLeft size={15} strokeWidth={1.6} aria-hidden="true" />
                      </Link>
                      <label className={styles.searchField}>
                        <Search size={15} strokeWidth={1.6} aria-hidden="true" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Buscar nesta doc..."
                          aria-label="Buscar seções nesta documentação"
                        />
                      </label>
                    </div>
                    <div className={styles.toolbarActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label="Compartilhar"
                        onClick={shareDoc}
                      >
                        <Share size={15} strokeWidth={1.6} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        aria-label="Excluir"
                        onClick={deleteDoc}
                      >
                        <Trash2 size={15} strokeWidth={1.6} aria-hidden="true" />
                      </button>
                      <div className={styles.moreMenu} ref={moreMenuRef}>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${moreMenuOpen ? styles.iconButtonActive : ''}`}
                          aria-label="Mais ações"
                          aria-haspopup="menu"
                          aria-expanded={moreMenuOpen}
                          aria-controls="docs-more-menu"
                          onClick={() => setMoreMenuOpen((open) => !open)}
                        >
                          <MoreHorizontal size={15} strokeWidth={1.6} aria-hidden="true" />
                        </button>
                        {moreMenuOpen ? (
                          <div
                            id="docs-more-menu"
                            className={styles.moreMenuPanel}
                            role="menu"
                            aria-label="Mais ações da documentação"
                          >
                            <button
                              type="button"
                              className={styles.moreMenuItem}
                              role="menuitem"
                              onClick={() => runMoreAction('duplicate')}
                            >
                              <Copy size={14} strokeWidth={1.6} aria-hidden="true" />
                              Duplicar
                            </button>
                            <button
                              type="button"
                              className={styles.moreMenuItem}
                              role="menuitem"
                              onClick={() => runMoreAction('rename')}
                            >
                              <Pencil size={14} strokeWidth={1.6} aria-hidden="true" />
                              Renomear
                            </button>
                            <button
                              type="button"
                              className={styles.moreMenuItem}
                              role="menuitem"
                              onClick={() => runMoreAction('export')}
                            >
                              <Download size={14} strokeWidth={1.6} aria-hidden="true" />
                              Exportar
                            </button>
                            <button
                              type="button"
                              className={styles.moreMenuItem}
                              role="menuitem"
                              onClick={() => runMoreAction('copy-link')}
                            >
                              <Link2 size={14} strokeWidth={1.6} aria-hidden="true" />
                              Copiar link
                            </button>
                            <div className={styles.moreMenuDivider} role="separator" />
                            <button
                              type="button"
                              className={`${styles.moreMenuItem} ${styles.moreMenuItemDanger}`}
                              role="menuitem"
                              onClick={() => runMoreAction('delete')}
                            >
                              <Trash2 size={14} strokeWidth={1.6} aria-hidden="true" />
                              Excluir
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </header>

                  <div className={styles.docHeader}>
                    {isBlankDoc ? (
                      <>
                        <input
                          ref={titleInputRef}
                          className={styles.docTitleInput}
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          placeholder="Título"
                          aria-label="Título do documento"
                        />
                        <input
                          className={styles.docDescriptionInput}
                          value={draftDescription}
                          onChange={(event) => setDraftDescription(event.target.value)}
                          placeholder="Adicione um subtítulo..."
                          aria-label="Subtítulo do documento"
                        />
                      </>
                    ) : (
                      <>
                        <h1 className={styles.docTitle}>{activeDoc.title}</h1>
                        <p className={styles.docDescription}>{activeDoc.description}</p>
                        <p className={styles.docMeta}>{activeDoc.publishedLabel}</p>
                      </>
                    )}
                  </div>

                  <ul className={styles.contributors} aria-label="Contribuidores">
                    {activeDoc.contributors.map((person) => (
                      <li key={person.id} className={styles.contributor}>
                        <ContributorAvatar name={person.name} initials={person.initials} />
                        <div className={styles.contributorCopy}>
                          <span className={styles.contributorName}>{person.name}</span>
                          <span className={styles.contributorRole}>{person.role}</span>
                        </div>
                      </li>
                    ))}
                    {isBlankDoc ? (
                      <li className={styles.contributor}>
                        <button type="button" className={styles.addMemberButton}>
                          <span className={styles.addMemberAvatar} aria-hidden="true">
                            <Plus size={14} strokeWidth={1.6} />
                          </span>
                          <span className={styles.contributorCopy}>
                            <span className={styles.contributorName}>Adicionar membro</span>
                          </span>
                        </button>
                      </li>
                    ) : null}
                  </ul>

                  <div className={styles.body}>
                    {isBlankDoc ? (
                      <DocsBodyComposer
                        value={draftBody}
                        onChange={setDraftBody}
                        placeholder="Uma palavra leva à outra..."
                      />
                    ) : (
                      activeDoc.sections.map((section) => (
                        <section
                          key={section.id}
                          id={sectionDomId(section.id)}
                          data-doc-section={section.id}
                          className={styles.bodySection}
                        >
                          <h2 className={styles.bodyHeading}>{section.heading}</h2>
                          {section.paragraphs.map((paragraph) => (
                            <p key={paragraph} className={styles.bodyText}>
                              {paragraph}
                            </p>
                          ))}
                          {section.image ? (
                            <figure className={styles.figure}>
                              <div
                                className={styles.figureMedia}
                                style={{ backgroundImage: section.image.gradient }}
                                role="img"
                                aria-label={section.image.alt}
                              />
                            </figure>
                          ) : null}
                        </section>
                      ))
                    )}
                  </div>
                </div>
              </CustomScrollArea>

              <aside
                id="docs-library-pane"
                className={`${styles.relatedPane} ${docsOpen ? '' : styles.relatedPaneCollapsed}`}
                aria-label="Documentos"
              >
                <div className={styles.paneHeader}>
                  {docsOpen ? (
                    <p className={styles.relatedLabel}>
                      <Link to={ROUTES.docs} className={styles.relatedHomeLink}>
                        Docs
                      </Link>
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className={styles.paneToggle}
                    aria-label={docsOpen ? 'Ocultar docs' : 'Mostrar docs'}
                    aria-controls="docs-library-pane"
                    aria-expanded={docsOpen}
                    onClick={() => setDocsOpen((open) => !open)}
                  >
                    {docsOpen ? (
                      <PanelRightClose size={15} strokeWidth={1.6} aria-hidden="true" />
                    ) : (
                      <PanelRightOpen size={15} strokeWidth={1.6} aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div
                  className={styles.relatedBody}
                  aria-hidden={!docsOpen}
                  {...(!docsOpen ? { inert: '' } : {})}
                >
                  <CustomScrollArea
                    className={styles.relatedScroll}
                    viewportClassName={styles.relatedViewport}
                    refreshKey={`docs-library:${docsOpen}`}
                  >
                    <div className={styles.relatedList}>
                      {DOCS_LIBRARY.map((doc) => {
                        const thumb = getDocCover(doc)
                        const selected = doc.id === activeDoc.id
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            className={`${styles.relatedCard} ${selected ? styles.relatedCardSelected : ''}`}
                            aria-current={selected ? 'page' : undefined}
                            onClick={() => openDoc(doc.id)}
                          >
                            <span
                              className={styles.relatedThumb}
                              style={thumb ? { backgroundImage: thumb.gradient } : undefined}
                              aria-hidden="true"
                            />
                            <span className={styles.relatedTitle}>{doc.title}</span>
                            <span className={styles.relatedExcerpt}>{doc.description}</span>
                          </button>
                        )
                      })}
                    </div>
                  </CustomScrollArea>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </ProductAppShell>
    </AppThemeScope>
  )
}
