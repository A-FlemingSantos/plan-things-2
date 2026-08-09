import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import {
  Code2,
  Image,
  Link2,
  Lock,
  MessageSquareLock,
  Minus,
  Plus,
  Quote,
  X,
} from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { usePreferences } from '../../preferences/context/PreferencesContext.jsx'
import { resolveDocumentLang } from '../../preferences/utils/documentLang.js'
import { apiRequest } from '../../../shared/api/apiClient.js'
import { useAuthenticatedImageUrl } from '../../../shared/hooks/useAuthenticatedImageUrl.js'
import {
  filterAnchoredComments,
  findQuoteTopAtOccurrence,
  getQuoteOccurrenceIndex,
  resolveMarkdownSelection,
} from '../utils/commentAnchors.js'
import { normalizeDocsEmbedMarkdown } from '../utils/docsEmbedMarkdown.js'
import { handleMarkdownPaste } from '../utils/markdownPaste.js'
import { DocsCodeBlock } from './DocsCodeBlockExtension.jsx'
import { createDocsEmbedExtension, UnsplashLogo, YouTubeLogo } from './docsEmbedExtension.jsx'

const ICON_STROKE = 1.6

function AuthenticatedImageView({ node }) {
  const source = useAuthenticatedImageUrl(node.attrs.src)
  return (
    <NodeViewWrapper>
      {source ? <img src={source} alt={node.attrs.alt ?? ''} /> : null}
    </NodeViewWrapper>
  )
}

const AuthenticatedImage = ImageExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AuthenticatedImageView)
  },
})

const BLOCK_ACTIONS = [
  { id: 'image', label: 'Imagem', Icon: Image },
  { id: 'unsplash', label: 'Unsplash', Icon: UnsplashLogo },
  { id: 'video', label: 'Vídeo', Icon: YouTubeLogo },
  { id: 'quote', label: 'Adicionar citação', Icon: Quote },
  { id: 'code', label: 'Bloco de código', Icon: Code2 },
  { id: 'divider', label: 'Linha', Icon: Minus },
]

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function tagEditorHeadings(editorRoot, bodyHeadingClass) {
  if (!editorRoot) return
  editorRoot.querySelectorAll('h1, h2, h3').forEach((element, index) => {
    element.setAttribute('data-doc-heading', String(index))
    if (bodyHeadingClass) element.classList.add(bodyHeadingClass)
  })
}

export default function MarkdownWysiwygComposer({
  value,
  onChange,
  onAddComment,
  onDeleteComment,
  canDeleteComment,
  comments,
  placeholder,
  styles,
}) {
  const { currentUser, accessToken } = useAuth()
  const { generalPreferences } = usePreferences()
  const spellcheckLang = resolveDocumentLang(generalPreferences?.language)
  const editorRef = useRef(null)
  const composerRef = useRef(null)
  const composerMainRef = useRef(null)
  const railRef = useRef(null)
  const selectionToolbarRef = useRef(null)
  const urlPromptRef = useRef(null)
  const urlInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const noteDraftRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selection, setSelection] = useState(null)
  const [insertTop, setInsertTop] = useState(null)
  const [pendingNote, setPendingNote] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [urlPrompt, setUrlPrompt] = useState(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [noteOffsets, setNoteOffsets] = useState({})

  const syncSelection = useCallback((activeEditor) => {
    const { from, to, $from } = activeEditor.state.selection
    const composerRect = composerRef.current?.getBoundingClientRect()
    const isEmptyParagraph = $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0

    if (composerRect) {
      const cursor = activeEditor.view.coordsAtPos(from)
      setInsertTop(isEmptyParagraph ? cursor.top - composerRect.top + 12 : null)
    } else {
      setInsertTop(null)
    }

    if (from === to) {
      setSelection(null)
      return
    }

    const cursor = activeEditor.view.coordsAtPos(from)
    const end = activeEditor.view.coordsAtPos(to)
    setSelection({
      from,
      to,
      top: Math.min(cursor.top, end.top) - 10,
      left: (cursor.left + end.right) / 2,
    })
    setMenuOpen(false)
  }, [])

  const anchoredComments = useMemo(
    () => filterAnchoredComments(value, comments),
    [comments, value],
  )

  const refreshVisualState = useCallback((activeEditor) => {
    if (!activeEditor) return
    const editorRoot = activeEditor.view.dom
    const composerMain = composerMainRef.current
    const markdown = activeEditor.getMarkdown()
    tagEditorHeadings(editorRoot, styles.bodyHeading)

    if (composerMain) {
      const nextOffsets = {}
      filterAnchoredComments(markdown, comments).forEach((comment) => {
        const occurrence = getQuoteOccurrenceIndex(markdown, comment.quotedText, comment.selectionStart)
        const top = findQuoteTopAtOccurrence(editorRoot, composerMain, comment.quotedText, occurrence)
        if (top != null) nextOffsets[comment.id] = top
      })
      setNoteOffsets(nextOffsets)
    }
  }, [comments, styles.bodyHeading])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      DocsCodeBlock,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      AuthenticatedImage,
      createDocsEmbedExtension(styles),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        'aria-label': 'Conteúdo do documento',
        // Keep lang in sync with Settings (pt-BR / en-US) for a11y and any
        // browser/OS tools. Native spellcheck stays off: mixed PT/EN technical
        // docs produce constant false positives and block editing.
        lang: spellcheckLang,
        spellcheck: 'false',
        style: 'outline: none',
      },
      handlePaste(_view, event) {
        return handleMarkdownPaste(editorRef.current, event)
      },
    },
    onCreate: ({ editor: activeEditor }) => {
      editorRef.current = activeEditor
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getMarkdown())
      tagEditorHeadings(activeEditor.view.dom, styles.bodyHeading)
      refreshVisualState(activeEditor)
    },
    onSelectionUpdate: ({ editor: activeEditor }) => syncSelection(activeEditor),
    onFocus: ({ editor: activeEditor }) => syncSelection(activeEditor),
    onBlur: () => {
      setSelection(null)
      setMenuOpen(false)
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const dom = editor.view.dom
    dom.setAttribute('lang', spellcheckLang)
    dom.setAttribute('spellcheck', 'false')
  }, [editor, spellcheckLang])

  useEffect(() => {
    if (!editor) return
    const normalized = normalizeDocsEmbedMarkdown(value)
    if (editor.getMarkdown() === normalized) return

    const scrollRoot = editor.view.dom.closest('[data-custom-scroll-viewport]')
    const previousScrollTop = scrollRoot?.scrollTop ?? null

    editor.commands.setContent(normalized, { emitUpdate: false, contentType: 'markdown' })
    refreshVisualState(editor)

    if (scrollRoot != null && previousScrollTop != null) {
      scrollRoot.scrollTop = previousScrollTop
      requestAnimationFrame(() => {
        scrollRoot.scrollTop = previousScrollTop
      })
    }
  }, [editor, refreshVisualState, value])

  useEffect(() => {
    if (!editor) return undefined
    refreshVisualState(editor)
    const onResize = () => refreshVisualState(editor)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [editor, refreshVisualState])

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
    if (!selection) return undefined
    const clearOutside = (event) => {
      if (selectionToolbarRef.current?.contains(event.target)) return
      if (urlPromptRef.current?.contains(event.target)) return
      if (composerRef.current?.contains(event.target)) return
      setSelection(null)
      setUrlPrompt(null)
    }
    const clearOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSelection(null)
        setUrlPrompt(null)
      }
    }
    const onScroll = () => {
      if (!editor || selection?.from == null) return
      syncSelection(editor)
      refreshVisualState(editor)
    }
    document.addEventListener('pointerdown', clearOutside)
    document.addEventListener('keydown', clearOnEscape)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', clearOutside)
      document.removeEventListener('keydown', clearOnEscape)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [editor, refreshVisualState, selection, syncSelection])

  useEffect(() => {
    if (!urlPrompt) {
      setUrlDraft('')
      return undefined
    }

    requestAnimationFrame(() => urlInputRef.current?.focus())

    const closeOutside = (event) => {
      if (urlPromptRef.current?.contains(event.target)) return
      if (selectionToolbarRef.current?.contains(event.target)) return
      if (railRef.current?.contains(event.target)) return
      setUrlPrompt(null)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setUrlPrompt(null)
    }

    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [urlPrompt])

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

  const applyBlock = (blockId) => {
    if (!editor) return
    const chain = editor.chain().focus()
    if (blockId === 'quote') {
      chain.toggleBlockquote().run()
      setMenuOpen(false)
      return
    }
    if (blockId === 'code') {
      chain.toggleCodeBlock().run()
      setMenuOpen(false)
      return
    }
    if (blockId === 'divider') {
      chain.setHorizontalRule().run()
      setMenuOpen(false)
      return
    }
    if (blockId === 'image') {
      setMenuOpen(false)
      imageInputRef.current?.click()
      return
    }
    if (blockId === 'unsplash' || blockId === 'video') {
      editor.chain().focus().insertContent({
        type: 'docsEmbed',
        attrs: {
          kind: blockId === 'video' ? 'video' : 'unsplash',
          url: '',
          query: '',
          page: 1,
          pageToken: '',
        },
      }).run()
      setMenuOpen(false)
      return
    }

    setMenuOpen(false)
  }

  const submitUrlPrompt = () => {
    const url = urlDraft.trim()
    if (!url || !editor || !urlPrompt) return

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    setUrlPrompt(null)
    setUrlDraft('')
  }

  const uploadImage = async (event) => {
    const [file] = event.target.files ?? []
    event.target.value = ''
    if (!file || !editor) return

    const formData = new FormData()
    formData.append('file', file)
    const uploaded = await apiRequest('/api/files/upload', {
      method: 'POST',
      token: accessToken,
      body: formData,
    })
    editor.chain().focus().setImage({
      src: `/api/files/${uploaded.id}/download`,
      alt: uploaded.name,
    }).run()
  }

  const applySelectionAction = (action) => {
    if (!editor || !selection) return
    if (action === 'comment') {
      const quote = editor.state.doc.textBetween(selection.from, selection.to, ' ')
      if (quote) {
        setPendingNote({
          quote,
          from: selection.from,
          to: selection.to,
        })
      }
      setSelection(null)
      return
    }

    const chain = editor.chain().focus()
    if (action === 'bold') chain.toggleBold().run()
    else if (action === 'italic') chain.toggleItalic().run()
    else if (action === 'title') chain.toggleHeading({ level: 1 }).run()
    else if (action === 'subtitle') chain.toggleHeading({ level: 2 }).run()
    else if (action === 'quote') chain.toggleBlockquote().run()
    else if (action === 'link') {
      setUrlPrompt({ anchor: 'link' })
    }
  }

  const sendNote = async () => {
    if (!pendingNote || !noteDraft.trim() || !editor) return
    const range = resolveMarkdownSelection(editor, pendingNote.from, pendingNote.to)
    if (!range) return
    await onAddComment({
      body: noteDraft.trim(),
      quotedText: pendingNote.quote,
      selectionStart: range.selectionStart,
      selectionEnd: range.selectionEnd,
    })
    setPendingNote(null)
    setNoteDraft('')
  }

  const authorName = currentUser?.fullName?.trim() || 'Você'
  const notes = useMemo(
    () => anchoredComments.map((comment) => ({
      ...comment,
      authorInitials: getInitials(comment.author?.fullName),
    })),
    [anchoredComments],
  )

  if (!editor) return null

  const urlMenu = urlPrompt ? (
    <div
      ref={urlPromptRef}
      className={`${styles.coupledMenuPanel} ${styles.coupledMenuPanelToolbar}`}
      style={selection
        ? { top: selection.top + 44, left: selection.left }
        : undefined}
      role="group"
      aria-label="Inserir URL"
    >
      <input
        ref={urlInputRef}
        type="url"
        className={styles.coupledMenuInput}
        value={urlDraft}
        placeholder="https://..."
        onChange={(event) => setUrlDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            submitUrlPrompt()
          }
        }}
      />
      <div className={styles.coupledMenuActions}>
        <button type="button" className={styles.coupledMenuCancel} onClick={() => setUrlPrompt(null)}>
          Cancelar
        </button>
        <button type="button" className={styles.coupledMenuSubmit} onClick={submitUrlPrompt} disabled={!urlDraft.trim()}>
          Inserir
        </button>
      </div>
    </div>
  ) : null

  return (
    <div ref={composerRef} className={styles.composerShell}>
      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={uploadImage} />
      <div ref={composerMainRef} className={styles.composerMain}>
        <div className={styles.composer} role="textbox" aria-label="Conteúdo do documento" aria-multiline="true">
          {selection ? (
            <>
            <div ref={selectionToolbarRef} className={styles.selectionToolbar} role="toolbar" aria-label="Formatação do texto" style={{ top: selection.top, left: selection.left }}>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolBold}`} title="Negrito" aria-label="Negrito" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('bold')}>B</button>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolItalic}`} title="Itálico" aria-label="Itálico" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('italic')}>i</button>
              <button type="button" className={styles.selectionToolButton} title="Inserir link" aria-label="Inserir link" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('link')}><Link2 size={14} strokeWidth={1.8} aria-hidden="true" /></button>
              <span className={styles.selectionToolDivider} aria-hidden="true" />
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolTitle}`} title="Título" aria-label="Título" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('title')}>T</button>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolSubtitle}`} title="Subtítulo" aria-label="Subtítulo" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('subtitle')}>T</button>
              <button type="button" className={styles.selectionToolButton} title="Citação" aria-label="Citação" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('quote')}><Quote size={14} strokeWidth={1.8} aria-hidden="true" /></button>
              <span className={styles.selectionToolDivider} aria-hidden="true" />
              <button type="button" className={styles.selectionToolButton} title="Adicionar comentário" aria-label="Adicionar comentário" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('comment')}><MessageSquareLock size={14} strokeWidth={1.8} aria-hidden="true" /></button>
            </div>
            {urlPrompt ? urlMenu : null}
          </>
          ) : null}
          <div className={styles.composerRow}>
            <div className={styles.composerRail} ref={railRef} style={insertTop == null ? undefined : { top: insertTop }}>
              {insertTop != null ? (
                <div className={`${styles.blockInsert} ${menuOpen ? styles.blockInsertOpen : ''}`}>
                  <button type="button" className={styles.blockInsertButton} title={menuOpen ? 'Fechar' : 'Adicionar bloco'} aria-label={menuOpen ? 'Fechar opções de bloco' : 'Adicionar bloco'} aria-expanded={menuOpen} onMouseDown={(event) => event.preventDefault()} onClick={() => setMenuOpen((open) => !open)}><Plus size={14} strokeWidth={ICON_STROKE} aria-hidden="true" /></button>
                  <div className={styles.blockActions} role="toolbar" aria-label="Inserir bloco" aria-hidden={!menuOpen} {...(!menuOpen ? { inert: '' } : {})}>
                    {BLOCK_ACTIONS.map(({ id, label, Icon }) => (
                      <button key={id} type="button" className={styles.blockActionButton} title={label} aria-label={label} tabIndex={menuOpen ? 0 : -1} onMouseDown={(event) => event.preventDefault()} onClick={() => applyBlock(id)}>
                        <Icon size={17} strokeWidth={ICON_STROKE} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <EditorContent editor={editor} className={styles.bodyComposer} />
          </div>
          {pendingNote ? (
            <div className={styles.noteComposer} role="dialog" aria-label="Notas privadas">
              <div className={styles.noteComposerHeader}>
                <span className={styles.noteComposerHeaderLabel}><Lock size={12} strokeWidth={1.8} aria-hidden="true" />Notas privadas</span>
                <button type="button" className={styles.noteComposerHeaderAction} title="Quem pode ver isto?">Quem pode ver isto?</button>
              </div>
              <div className={styles.noteComposerBody}>
                <div className={styles.noteComposerAuthor}>
                  <span className={styles.noteComposerAvatar} aria-hidden="true">{getInitials(authorName)}</span>
                  <span className={styles.noteComposerAuthorName}>{authorName}</span>
                </div>
                <textarea ref={noteDraftRef} className={styles.noteComposerInput} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Escreva uma nota..." aria-label="Escreva uma nota" rows={3} />
                <div className={styles.noteComposerActions}>
                  <button type="button" className={styles.noteComposerSend} onClick={sendNote} disabled={!noteDraft.trim()}>Enviar</button>
                  <button type="button" className={styles.noteComposerCancel} onClick={() => { setPendingNote(null); setNoteDraft('') }}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <aside className={styles.commentsSection} aria-label="Comentários do documento">
        {notes.map((note, index) => (
          <article
            key={note.id}
            className={styles.compactNote}
            style={{ top: noteOffsets[note.id] ?? index * 76 }}
            title={note.body}
          >
            <span className={styles.compactNoteAvatar} aria-hidden="true">{note.authorInitials}</span>
            <p className={styles.compactNoteText}>{note.body}</p>
            {canDeleteComment?.(note) ? (
              <button
                type="button"
                className={styles.compactNoteDelete}
                aria-label="Excluir comentário"
                title="Excluir comentário"
                onClick={() => onDeleteComment?.(note.id)}
              >
                <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ) : null}
          </article>
        ))}
      </aside>
    </div>
  )
}
