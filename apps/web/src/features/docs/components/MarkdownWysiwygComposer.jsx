import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
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
  Video,
} from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'

function UnsplashLogo({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M10 9V0h12v9H10zm12 5h10v-9h10v18H0V14h10v9h12v-9z" />
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

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

export default function MarkdownWysiwygComposer({
  value,
  onChange,
  onAddComment,
  comments,
  placeholder,
  styles,
}) {
  const { currentUser } = useAuth()
  const composerRef = useRef(null)
  const selectionToolbarRef = useRef(null)
  const noteDraftRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selection, setSelection] = useState(null)
  const [insertTop, setInsertTop] = useState(null)
  const [pendingNote, setPendingNote] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')

  const syncSelection = useCallback((activeEditor) => {
    const { from, to, $from } = activeEditor.state.selection
    const cursor = activeEditor.view.coordsAtPos(from)
    const composerRect = composerRef.current?.getBoundingClientRect()
    const isEmptyParagraph = $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0

    setInsertTop(isEmptyParagraph && composerRect ? cursor.top - composerRect.top + 12 : null)
    if (from === to) {
      setSelection(null)
      return
    }

    const end = activeEditor.view.coordsAtPos(to)
    setSelection({
      from,
      to,
      top: Math.min(cursor.top, end.top) - 10,
      left: (cursor.left + end.right) / 2,
    })
    setMenuOpen(false)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      ImageExtension,
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value,
    contentType: 'markdown',
    editorProps: {
      attributes: {
        'aria-label': 'Conteúdo do documento',
        style: 'outline: none',
      },
    },
    onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getMarkdown()),
    onSelectionUpdate: ({ editor: activeEditor }) => syncSelection(activeEditor),
    onFocus: ({ editor: activeEditor }) => syncSelection(activeEditor),
    onBlur: () => {
      setSelection(null)
      setMenuOpen(false)
    },
  })

  useEffect(() => {
    if (!editor || editor.getMarkdown() === value) return
    editor.commands.setContent(value, { emitUpdate: false, contentType: 'markdown' })
  }, [editor, value])

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
    if (blockId === 'quote') chain.toggleBlockquote().run()
    else if (blockId === 'code') chain.toggleCodeBlock().run()
    else if (blockId === 'divider') chain.setHorizontalRule().run()
    else {
      const prompt = blockId === 'video' ? 'Cole a URL do vídeo' : 'Cole a URL da imagem'
      const url = window.prompt(prompt)
      if (!url?.trim()) return
      if (blockId === 'video') chain.insertContent(url.trim()).run()
      else chain.setImage({ src: url.trim(), alt: blockId === 'unsplash' ? 'Imagem do Unsplash' : '' }).run()
    }
    setMenuOpen(false)
  }

  const applySelectionAction = (action) => {
    if (!editor || !selection) return
    if (action === 'comment') {
      const quote = editor.state.doc.textBetween(selection.from, selection.to, ' ')
      if (quote) setPendingNote({ quote })
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
      const url = window.prompt('Cole a URL do link')
      if (url?.trim()) chain.extendMarkRange('link').setLink({ href: url.trim() }).run()
    }
  }

  const sendNote = async () => {
    if (!pendingNote || !noteDraft.trim()) return
    const source = editor?.getMarkdown() ?? value
    const selectionStart = source.indexOf(pendingNote.quote)
    await onAddComment({
      body: noteDraft.trim(),
      quotedText: pendingNote.quote,
      selectionStart: Math.max(selectionStart, 0),
      selectionEnd: Math.max(selectionStart, 0) + pendingNote.quote.length,
    })
    setPendingNote(null)
    setNoteDraft('')
  }

  const authorName = currentUser?.fullName?.trim() || 'Você'
  const notes = useMemo(
    () => comments.map((comment) => ({
      ...comment,
      authorInitials: getInitials(comment.author?.fullName),
    })),
    [comments],
  )

  if (!editor) return null

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
          <div className={styles.composerRow}>
            <div className={styles.composerRail} style={insertTop == null ? undefined : { top: insertTop }}>
              {insertTop != null ? (
                <div className={`${styles.blockInsert} ${menuOpen ? styles.blockInsertOpen : ''}`}>
                  <button type="button" className={styles.blockInsertButton} title={menuOpen ? 'Fechar' : 'Adicionar bloco'} aria-label={menuOpen ? 'Fechar opções de bloco' : 'Adicionar bloco'} aria-expanded={menuOpen} onMouseDown={(event) => event.preventDefault()} onClick={() => setMenuOpen((open) => !open)}><Plus size={14} /></button>
                  <div className={styles.blockActions} role="toolbar" aria-label="Inserir bloco" aria-hidden={!menuOpen}>
                    {BLOCK_ACTIONS.map(({ id, label, Icon }) => <button key={id} type="button" className={styles.blockActionButton} title={label} aria-label={label} tabIndex={menuOpen ? 0 : -1} onMouseDown={(event) => event.preventDefault()} onClick={() => applyBlock(id)}><Icon size={15} /></button>)}
                  </div>
                </div>
              ) : null}
            </div>
            <EditorContent editor={editor} className={styles.bodyComposer} />
          </div>
          {pendingNote ? (
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
      </div>
      <aside className={styles.commentsSection} aria-label="Comentários do documento">
        {notes.map((note, index) => <article key={note.id} className={styles.compactNote} style={{ top: index * 76 }} title={note.quotedText}><span className={styles.compactNoteAvatar}>{note.authorInitials}</span><p className={styles.compactNoteText}>{note.body}</p></article>)}
      </aside>
    </div>
  )
}
