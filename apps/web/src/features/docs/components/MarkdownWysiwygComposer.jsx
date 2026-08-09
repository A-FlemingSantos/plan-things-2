import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from '@tiptap/markdown'
import {
  BookOpen,
  ChevronRight,
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
import { buildDocsPath } from '../../../shared/config/routes.js'
import { useAuthenticatedImageUrl } from '../../../shared/hooks/useAuthenticatedImageUrl.js'
import {
  filterAnchoredComments,
  findQuoteTopAtOccurrence,
  getQuoteOccurrenceIndex,
  resolveMarkdownSelection,
} from '../utils/commentAnchors.js'
import { normalizeDocsEmbedMarkdown } from '../utils/docsEmbedMarkdown.js'
import { listDocHeadingElements, tagDocHeadingElements } from '../utils/docsHeadings.js'
import { DocsListKeymap, isTopLevelEmptyParagraph } from '../utils/listEditing.js'
import {
  DocsCaretScrollLock,
  isScrollIntoViewSuppressed,
  pinCustomViewportScrollTop,
  scrollSelectionIntoCustomViewport,
  suppressScrollIntoView,
} from '../utils/editorScroll.js'
import { handleMarkdownPaste } from '../utils/markdownPaste.js'
import { summarizeLinkHref } from '../utils/summarizeLinkHref.js'
import { DocsCodeBlock } from './DocsCodeBlockExtension.jsx'
import { createDocsEmbedExtension, UnsplashLogo, YouTubeLogo } from './docsEmbedExtension.jsx'

const ICON_STROKE = 1.6
// Wait until the user finishes selecting (mouseup / selection idle) before showing
// the floating format toolbar — popping it up mid-drag is distracting.
const SELECTION_TOOLBAR_DELAY_MS = 500
// Keep the link chip visible briefly so the pointer can reach the remove control.
const LINK_HOVER_HIDE_DELAY_MS = 160
// Non-empty deps so TipTap does NOT call setOptions on every React render.
// With deps=[], compareOptions sees a new `content`/`extensions` each keystroke
// and updateState/setProps fights the caret scroll at the bottom of long docs.
const DOC_WYSIWYG_EDITOR_DEPS = ['docs-wysiwyg-composer']

function findEditorLinkElement(target, editorRoot) {
  if (!(target instanceof Element) || !editorRoot) return null
  const anchor = target.closest('a[href]')
  if (!anchor || !editorRoot.contains(anchor)) return null
  return anchor
}

function measureSelectionToolbar(activeEditor) {
  const { from, to } = activeEditor.state.selection
  if (from === to) return null
  const cursor = activeEditor.view.coordsAtPos(from)
  const end = activeEditor.view.coordsAtPos(to)
  return {
    from,
    to,
    top: Math.min(cursor.top, end.top) - 10,
    left: (cursor.left + end.right) / 2,
  }
}

function measureLinkPanelAnchor(button, fallback = null) {
  if (!button) return fallback
  const rect = button.getBoundingClientRect()
  return {
    top: rect.bottom,
    left: rect.left + (rect.width / 2),
  }
}

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
  tagDocHeadingElements(editorRoot)
  if (!bodyHeadingClass || !editorRoot) return
  listDocHeadingElements(editorRoot).forEach((element) => {
    element.classList.add(bodyHeadingClass)
  })
}

function withPreservedScroll(editor, run) {
  if (!editor) return
  const scrollRoot = editor.view.dom.closest('[data-custom-scroll-viewport]')
  const previousScrollTop = scrollRoot?.scrollTop ?? null
  suppressScrollIntoView(160)
  run()
  if (!scrollRoot || previousScrollTop == null) return
  pinCustomViewportScrollTop(scrollRoot, previousScrollTop, { frames: 4 })
}

const MarkdownWysiwygComposer = memo(forwardRef(function MarkdownWysiwygComposer({
  value,
  onChange,
  onAddComment,
  onDeleteComment,
  canDeleteComment,
  comments,
  linkableDocuments = [],
  scrollTopRef = null,
  placeholder,
  styles,
}, ref) {
  const { currentUser, accessToken } = useAuth()
  const { generalPreferences } = usePreferences()
  const spellcheckLang = resolveDocumentLang(generalPreferences?.language)
  const editorRef = useRef(null)
  const composerRef = useRef(null)
  const composerMainRef = useRef(null)
  const railRef = useRef(null)
  const selectionToolbarRef = useRef(null)
  const linkToolButtonRef = useRef(null)
  const linkPanelAnchorRef = useRef(null)
  const urlPromptRef = useRef(null)
  const urlInputRef = useRef(null)
  const docSearchInputRef = useRef(null)
  const linkHoverTooltipRef = useRef(null)
  const imageInputRef = useRef(null)
  const noteDraftRef = useRef(null)
  const lastEmittedMarkdownRef = useRef(null)
  const selectionToolbarTimerRef = useRef(null)
  const linkHoverHideTimerRef = useRef(null)
  const pointerSelectingRef = useRef(false)
  const selectionVisibleRef = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selection, setSelection] = useState(null)
  const [insertTop, setInsertTop] = useState(null)
  const [pendingNote, setPendingNote] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [urlPrompt, setUrlPrompt] = useState(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [docsMenuOpen, setDocsMenuOpen] = useState(false)
  const [docsMenuSide, setDocsMenuSide] = useState('right')
  const [docSearchQuery, setDocSearchQuery] = useState('')
  const [linkHover, setLinkHover] = useState(null)
  const [noteOffsets, setNoteOffsets] = useState({})
  const urlPromptOpenRef = useRef(false)

  selectionVisibleRef.current = selection != null
  urlPromptOpenRef.current = urlPrompt != null

  const clearLinkHoverHideTimer = useCallback(() => {
    if (linkHoverHideTimerRef.current == null) return
    clearTimeout(linkHoverHideTimerRef.current)
    linkHoverHideTimerRef.current = null
  }, [])

  const hideLinkHover = useCallback(() => {
    clearLinkHoverHideTimer()
    setLinkHover(null)
  }, [clearLinkHoverHideTimer])

  const scheduleHideLinkHover = useCallback(() => {
    clearLinkHoverHideTimer()
    linkHoverHideTimerRef.current = setTimeout(() => {
      linkHoverHideTimerRef.current = null
      setLinkHover(null)
    }, LINK_HOVER_HIDE_DELAY_MS)
  }, [clearLinkHoverHideTimer])

  const clearSelectionToolbarTimer = useCallback(() => {
    if (selectionToolbarTimerRef.current == null) return
    clearTimeout(selectionToolbarTimerRef.current)
    selectionToolbarTimerRef.current = null
  }, [])

  const scheduleSelectionToolbar = useCallback((activeEditor) => {
    clearSelectionToolbarTimer()
    selectionToolbarTimerRef.current = setTimeout(() => {
      selectionToolbarTimerRef.current = null
      if (!activeEditor || activeEditor.isDestroyed) return
      if (pointerSelectingRef.current) return
      const next = measureSelectionToolbar(activeEditor)
      if (!next) {
        setSelection(null)
        return
      }
      setSelection(next)
      setMenuOpen(false)
    }, SELECTION_TOOLBAR_DELAY_MS)
  }, [clearSelectionToolbarTimer])

  const syncSelection = useCallback((activeEditor, { immediate = false } = {}) => {
    const { from, to, $from } = activeEditor.state.selection
    const composerRect = composerRef.current?.getBoundingClientRect()
    // Only top-level empty paragraphs — list items get a + that looks misaligned
    // next to markers, and Backspace-lift used to leave a gap paragraph mid-list.
    const showInsert = isTopLevelEmptyParagraph($from)

    if (composerRect && showInsert) {
      const cursor = activeEditor.view.coordsAtPos(from)
      setInsertTop(cursor.top - composerRect.top + 12)
    } else {
      setInsertTop(null)
    }

    if (from === to) {
      // Keep the link panel open while focus is in the URL/doc picker.
      if (urlPromptOpenRef.current) return
      clearSelectionToolbarTimer()
      setSelection(null)
      return
    }

    // Scroll remasure: keep an already-visible toolbar pinned to the range.
    if (immediate) {
      if (!selectionVisibleRef.current) return
      const next = measureSelectionToolbar(activeEditor)
      if (next) setSelection(next)
      return
    }

    // Hide while the mouse button is still held during a drag-select.
    if (pointerSelectingRef.current) {
      clearSelectionToolbarTimer()
      setSelection(null)
      return
    }

    // Already showing (format clicks, keyboard adjust): remasure in place.
    if (selectionVisibleRef.current) {
      const next = measureSelectionToolbar(activeEditor)
      if (next) {
        setSelection(next)
        setMenuOpen(false)
      }
      return
    }

    // Fresh selection: wait until the gesture settles before opening the toolbar.
    scheduleSelectionToolbar(activeEditor)
  }, [clearSelectionToolbarTimer, scheduleSelectionToolbar])

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

    if (!composerMain) return

    const nextOffsets = {}
    filterAnchoredComments(markdown, comments).forEach((comment) => {
      const occurrence = getQuoteOccurrenceIndex(markdown, comment.quotedText, comment.selectionStart)
      const top = findQuoteTopAtOccurrence(editorRoot, composerMain, comment.quotedText, occurrence)
      if (top != null) nextOffsets[comment.id] = top
    })
    setNoteOffsets((current) => {
      const currentKeys = Object.keys(current)
      const nextKeys = Object.keys(nextOffsets)
      if (
        currentKeys.length === nextKeys.length
        && nextKeys.every((key) => current[key] === nextOffsets[key])
      ) {
        return current
      }
      return nextOffsets
    })
  }, [comments, styles.bodyHeading])

  const extensions = useMemo(() => [
    StarterKit.configure({
      codeBlock: false,
      // TipTap 3 ships Link inside StarterKit — do not also register @tiptap/extension-link.
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      },
    }),
    // Prefer deleting empty mid-list items over TipTap's liftListItem (which splits lists).
    DocsListKeymap,
    DocsCaretScrollLock,
    DocsCodeBlock,
    AuthenticatedImage,
    createDocsEmbedExtension(styles),
    Placeholder.configure({ placeholder }),
    Markdown,
  ], [placeholder, styles])

  const editor = useEditor({
    // Defer creation past the first render so React NodeViews (images/embeds/code)
    // do not call flushSync while React is still committing.
    immediatelyRender: false,
    extensions,
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
        // overflow-anchor: none disables ProseMirror's storeScrollPos/resetScrollPos
        // (it only skips when the inline style is set). That JS path overshoots when
        // deleting near the bottom of a long doc inside CustomScrollArea.
        style: 'outline: none; overflow-anchor: none',
      },
      handlePaste(_view, event) {
        return handleMarkdownPaste(editorRef.current, event)
      },
      handleScrollToSelection(view) {
        if (isScrollIntoViewSuppressed()) return true
        return scrollSelectionIntoCustomViewport(view)
      },
    },
    onCreate: ({ editor: activeEditor }) => {
      editorRef.current = activeEditor
      lastEmittedMarkdownRef.current = activeEditor.getMarkdown()
      tagEditorHeadings(activeEditor.view.dom, styles.bodyHeading)
      const scrollRoot = activeEditor.view.dom.closest('[data-custom-scroll-viewport]')
      const lockedTop = scrollTopRef?.current
      if (scrollRoot != null && lockedTop != null) {
        pinCustomViewportScrollTop(scrollRoot, lockedTop, { frames: 4 })
      }
    },
    onUpdate: ({ editor: activeEditor }) => {
      const markdown = activeEditor.getMarkdown()
      lastEmittedMarkdownRef.current = markdown
      onChange(markdown)
      refreshVisualState(activeEditor)
      // Do not mirror scrollTop into the parent here: when the viewport briefly
      // collapses mid-update, scrollTop is 0 and would poison mode-switch restore.
    },
    onSelectionUpdate: ({ editor: activeEditor }) => syncSelection(activeEditor),
    onFocus: ({ editor: activeEditor }) => syncSelection(activeEditor),
    onBlur: ({ event }) => {
      const nextTarget = event?.relatedTarget
      if (
        nextTarget
        && (
          urlPromptRef.current?.contains(nextTarget)
          || selectionToolbarRef.current?.contains(nextTarget)
        )
      ) {
        return
      }
      // Focusing the link panel blurs the editor; keep toolbar/panel mounted.
      if (urlPromptOpenRef.current) return
      if (selectionToolbarTimerRef.current != null) {
        clearTimeout(selectionToolbarTimerRef.current)
        selectionToolbarTimerRef.current = null
      }
      setSelection(null)
      setMenuOpen(false)
    },
  }, DOC_WYSIWYG_EDITOR_DEPS)

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return undefined
    const dom = editor.view.dom

    const onPointerDown = (event) => {
      if (event.button !== 0) return
      pointerSelectingRef.current = true
      clearSelectionToolbarTimer()
      setSelection(null)
      hideLinkHover()
    }

    const finishPointerSelect = () => {
      if (!pointerSelectingRef.current) return
      pointerSelectingRef.current = false
      scheduleSelectionToolbar(editor)
    }

    dom.addEventListener('pointerdown', onPointerDown)
    // Release often happens outside the editor after a drag-select.
    window.addEventListener('pointerup', finishPointerSelect)
    window.addEventListener('pointercancel', finishPointerSelect)

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', finishPointerSelect)
      window.removeEventListener('pointercancel', finishPointerSelect)
      clearSelectionToolbarTimer()
    }
  }, [clearSelectionToolbarTimer, editor, hideLinkHover, scheduleSelectionToolbar])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return undefined
    const dom = editor.view.dom

    const showForAnchor = (anchor) => {
      if (!anchor || urlPromptOpenRef.current || pointerSelectingRef.current) return
      const href = anchor.getAttribute('href')?.trim()
      if (!href) return
      const rect = anchor.getBoundingClientRect()
      clearLinkHoverHideTimer()
      setLinkHover({
        href,
        top: rect.top,
        left: rect.left + (rect.width / 2),
        anchor,
      })
    }

    const onPointerOver = (event) => {
      const anchor = findEditorLinkElement(event.target, dom)
      if (!anchor) return
      showForAnchor(anchor)
    }

    const onPointerOut = (event) => {
      const fromAnchor = findEditorLinkElement(event.target, dom)
      if (!fromAnchor) return
      const next = event.relatedTarget
      if (next instanceof Node) {
        if (fromAnchor.contains(next)) return
        if (linkHoverTooltipRef.current?.contains(next)) return
      }
      scheduleHideLinkHover()
    }

    const onScroll = () => hideLinkHover()

    dom.addEventListener('pointerover', onPointerOver)
    dom.addEventListener('pointerout', onPointerOut)
    window.addEventListener('scroll', onScroll, true)

    return () => {
      dom.removeEventListener('pointerover', onPointerOver)
      dom.removeEventListener('pointerout', onPointerOut)
      window.removeEventListener('scroll', onScroll, true)
      clearLinkHoverHideTimer()
    }
  }, [clearLinkHoverHideTimer, editor, hideLinkHover, scheduleHideLinkHover])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const dom = editor.view.dom
    dom.setAttribute('lang', spellcheckLang)
    dom.setAttribute('spellcheck', 'false')
  }, [editor, spellcheckLang])

  useEffect(() => {
    if (!editor) return undefined
    const normalized = normalizeDocsEmbedMarkdown(value)
    // Skip echo from our own onChange — remounting via setContent jumps scroll
    // and drops the caret, especially when deleting at the bottom of the page.
    if (
      normalized === lastEmittedMarkdownRef.current
      || editor.getMarkdown() === normalized
    ) {
      return undefined
    }

    const scrollRoot = editor.view.dom.closest('[data-custom-scroll-viewport]')
    const previousScrollTop = scrollRoot?.scrollTop ?? null
    let cancelled = false

    // setContent recreates React NodeViews, which call flushSync. Defer past
    // React's commit/effect phase (TipTap guidance for NodeView + useEffect).
    queueMicrotask(() => {
      if (cancelled || editor.isDestroyed) return
      if (
        normalized === lastEmittedMarkdownRef.current
        || editor.getMarkdown() === normalized
      ) {
        return
      }

      editor.commands.setContent(normalized, { emitUpdate: false, contentType: 'markdown' })
      lastEmittedMarkdownRef.current = editor.getMarkdown()
      refreshVisualState(editor)

      if (scrollRoot != null && previousScrollTop != null) {
        suppressScrollIntoView(160)
        pinCustomViewportScrollTop(scrollRoot, previousScrollTop, { frames: 4 })
      }
    })

    return () => {
      cancelled = true
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
      // Selection toolbar is viewport-fixed; only remeasure coords. Retagging
      // headings / note offsets during scroll forces TipTap DOM work and jank.
      syncSelection(editor, { immediate: true })
      if (!urlPromptOpenRef.current) return
      const anchor = measureLinkPanelAnchor(linkPanelAnchorRef.current)
      if (!anchor) return
      setUrlPrompt((current) => (
        current && (current.top !== anchor.top || current.left !== anchor.left)
          ? { ...current, ...anchor }
          : current
      ))
    }
    document.addEventListener('pointerdown', clearOutside)
    document.addEventListener('keydown', clearOnEscape)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', clearOutside)
      document.removeEventListener('keydown', clearOnEscape)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [editor, selection, syncSelection])

  useEffect(() => {
    if (!urlPrompt) {
      linkPanelAnchorRef.current = null
      setUrlDraft('')
      setDocSearchQuery('')
      setDocsMenuOpen(false)
      setDocsMenuSide('right')
      return undefined
    }

    requestAnimationFrame(() => {
      if (docsMenuOpen) docSearchInputRef.current?.focus()
      else urlInputRef.current?.focus()
    })

    const closeOutside = (event) => {
      if (urlPromptRef.current?.contains(event.target)) return
      if (selectionToolbarRef.current?.contains(event.target)) return
      if (railRef.current?.contains(event.target)) return
      setUrlPrompt(null)
    }
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      if (docsMenuOpen) {
        setDocsMenuOpen(false)
        requestAnimationFrame(() => urlInputRef.current?.focus())
        return
      }
      setUrlPrompt(null)
    }

    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [docsMenuOpen, urlPrompt])

  const filteredLinkableDocuments = useMemo(() => {
    const query = docSearchQuery.trim().toLowerCase()
    if (!query) return linkableDocuments
    return linkableDocuments.filter((document) => {
      const title = document.title?.toLowerCase() ?? ''
      const description = document.description?.toLowerCase() ?? ''
      return title.includes(query) || description.includes(query)
    })
  }, [docSearchQuery, linkableDocuments])

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

  const openLinkPrompt = useCallback((anchorEl = null) => {
    if (!editor) return
    setDocsMenuOpen(false)
    setDocSearchQuery('')
    const { from, to } = editor.state.selection
    let fallback = { top: window.innerHeight / 2, left: window.innerWidth / 2 }
    try {
      const coords = editor.view.coordsAtPos(from)
      fallback = { top: coords.bottom, left: coords.left }
    } catch {
      // Selection may be temporarily invalid while the view remounts.
    }
    const button = anchorEl ?? linkToolButtonRef.current
    linkPanelAnchorRef.current = button
    const anchor = measureLinkPanelAnchor(button, fallback)
    setUrlPrompt({
      anchor: 'link',
      top: anchor.top,
      left: anchor.left,
      from,
      to,
    })
  }, [editor])

  const applyFormat = useCallback((action, options = {}) => {
    if (!editor) return
    if (action === 'link') {
      openLinkPrompt(options.anchorEl ?? null)
      return
    }

    withPreservedScroll(editor, () => {
      const chain = editor.chain().focus(null, { scrollIntoView: false })
      if (action === 'bold') chain.toggleBold().run()
      else if (action === 'italic') chain.toggleItalic().run()
      else if (action === 'h1' || action === 'title') chain.toggleHeading({ level: 1 }).run()
      else if (action === 'h2' || action === 'subtitle') chain.toggleHeading({ level: 2 }).run()
      else if (action === 'h3') chain.toggleHeading({ level: 3 }).run()
      else if (action === 'quote') chain.toggleBlockquote().run()
      else if (action === 'bulletList') chain.toggleBulletList().run()
      else if (action === 'orderedList') chain.toggleOrderedList().run()
      else if (action === 'code') chain.toggleCodeBlock().run()
      else if (action === 'divider') chain.setHorizontalRule().run()
      else if (action === 'image') imageInputRef.current?.click()
      else if (action === 'unsplash' || action === 'video') {
        editor.chain().focus(null, { scrollIntoView: false }).insertContent({
          type: 'docsEmbed',
          attrs: {
            kind: action === 'video' ? 'video' : 'unsplash',
            url: '',
            query: '',
            page: 1,
            pageToken: '',
          },
        }).run()
      }
    })
  }, [editor, openLinkPrompt])

  useImperativeHandle(ref, () => ({ applyFormat }), [applyFormat])

  const applyBlock = (blockId) => {
    applyFormat(blockId)
    setMenuOpen(false)
  }

  const applyLinkHref = (href) => {
    if (!href || !editor || !urlPrompt) return
    const { from, to } = urlPrompt
    withPreservedScroll(editor, () => {
      const chain = editor.chain().focus(null, { scrollIntoView: false })
      if (typeof from === 'number' && typeof to === 'number' && from !== to) {
        chain.setTextSelection({ from, to })
      }
      chain.extendMarkRange('link').setLink({ href }).run()
    })
    setUrlPrompt(null)
    setUrlDraft('')
    setDocSearchQuery('')
    setDocsMenuOpen(false)
  }

  const submitUrlPrompt = () => {
    applyLinkHref(urlDraft.trim())
  }

  const submitDocLink = (documentId) => {
    applyLinkHref(buildDocsPath(documentId))
  }

  const openDocsMenu = () => {
    const panel = urlPromptRef.current
    if (!panel) {
      setDocsMenuSide('right')
      setDocsMenuOpen(true)
      return
    }
    const rect = panel.getBoundingClientRect()
    const flyoutWidth = 260
    const gap = 6
    const fitsRight = rect.right + gap + flyoutWidth <= window.innerWidth - 8
    setDocsMenuSide(fitsRight ? 'right' : 'left')
    setDocsMenuOpen(true)
  }

  const removeHoveredLink = () => {
    if (!editor || !linkHover?.anchor) return
    try {
      const pos = editor.view.posAtDOM(linkHover.anchor, 0)
      editor.chain().focus().setTextSelection(pos).extendMarkRange('link').unsetLink().run()
    } catch {
      // Anchor may have been remounted; fall back to the mark under the caret.
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    hideLinkHover()
  }

  const linkHoverLabel = useMemo(
    () => (linkHover?.href
      ? summarizeLinkHref(linkHover.href, { documents: linkableDocuments })
      : ''),
    [linkHover?.href, linkableDocuments],
  )

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

    if (action === 'link') {
      openLinkPrompt(linkToolButtonRef.current)
      return
    }

    applyFormat(action === 'title' ? 'h1' : action === 'subtitle' ? 'h2' : action)
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
      className={`${styles.linkPickerRoot} ${styles.coupledMenuPanelToolbar}`}
      style={{ top: urlPrompt.top, left: urlPrompt.left }}
      role="group"
      aria-label="Inserir link"
    >
      <div className={styles.linkPickerPanel}>
        <input
          ref={urlInputRef}
          type="url"
          className={styles.linkPickerInput}
          value={urlDraft}
          placeholder="https://..."
          aria-label="URL do link"
          onChange={(event) => {
            setUrlDraft(event.target.value)
            if (docsMenuOpen) setDocsMenuOpen(false)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submitUrlPrompt()
            }
          }}
        />
        <button
          type="button"
          className={`${styles.linkPickerItem} ${docsMenuOpen ? styles.linkPickerItemActive : ''}`}
          aria-haspopup="menu"
          aria-expanded={docsMenuOpen}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (docsMenuOpen) setDocsMenuOpen(false)
            else openDocsMenu()
          }}
        >
          <BookOpen size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
          <span className={styles.linkPickerItemLabel}>Outras docs</span>
          <ChevronRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
        </button>
      </div>
      {docsMenuOpen ? (
        <div
          className={`${styles.linkPickerFlyout} ${docsMenuSide === 'left' ? styles.linkPickerFlyoutLeft : ''}`}
          role="menu"
          aria-label="Outras docs"
        >
          <input
            ref={docSearchInputRef}
            type="search"
            className={styles.linkPickerInput}
            value={docSearchQuery}
            placeholder="Buscar documento..."
            aria-label="Buscar documento"
            onChange={(event) => setDocSearchQuery(event.target.value)}
          />
          <div className={styles.linkDocList} role="listbox" aria-label="Outras docs disponíveis">
            {filteredLinkableDocuments.length === 0 ? (
              <p className={styles.linkDocEmpty}>Nenhum documento encontrado</p>
            ) : filteredLinkableDocuments.map((document) => (
              <button
                key={document.id}
                type="button"
                role="option"
                className={styles.linkDocOption}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => submitDocLink(document.id)}
              >
                <span className={styles.linkDocOptionTitle}>{document.title || 'Documento sem título'}</span>
                {document.description ? (
                  <span className={styles.linkDocOptionExcerpt}>{document.description}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  ) : null

  return (
    <div ref={composerRef} className={styles.composerShell}>
      <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={uploadImage} />
      <div ref={composerMainRef} className={styles.composerMain}>
        <div className={styles.composer} role="textbox" aria-label="Conteúdo do documento" aria-multiline="true">
          {selection ? (
            <div ref={selectionToolbarRef} className={styles.selectionToolbar} role="toolbar" aria-label="Formatação do texto" style={{ top: selection.top, left: selection.left }}>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolBold}`} title="Negrito" aria-label="Negrito" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('bold')}>B</button>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolItalic}`} title="Itálico" aria-label="Itálico" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('italic')}>i</button>
              <button ref={linkToolButtonRef} type="button" className={styles.selectionToolButton} title="Inserir link" aria-label="Inserir link" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('link')}><Link2 size={14} strokeWidth={1.8} aria-hidden="true" /></button>
              <span className={styles.selectionToolDivider} aria-hidden="true" />
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolTitle}`} title="Título" aria-label="Título" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('title')}>T</button>
              <button type="button" className={`${styles.selectionToolButton} ${styles.selectionToolSubtitle}`} title="Subtítulo" aria-label="Subtítulo" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('subtitle')}>T</button>
              <button type="button" className={styles.selectionToolButton} title="Citação" aria-label="Citação" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('quote')}><Quote size={14} strokeWidth={1.8} aria-hidden="true" /></button>
              <span className={styles.selectionToolDivider} aria-hidden="true" />
              <button type="button" className={styles.selectionToolButton} title="Adicionar comentário" aria-label="Adicionar comentário" onMouseDown={(event) => event.preventDefault()} onClick={() => applySelectionAction('comment')}><MessageSquareLock size={14} strokeWidth={1.8} aria-hidden="true" /></button>
            </div>
          ) : null}
          {urlPrompt ? urlMenu : null}
          {linkHover && !urlPrompt ? (
            <div
              ref={linkHoverTooltipRef}
              className={styles.linkHoverTooltip}
              style={{ top: linkHover.top, left: linkHover.left }}
              role="tooltip"
              onPointerEnter={clearLinkHoverHideTimer}
              onPointerLeave={scheduleHideLinkHover}
            >
              <span className={styles.linkHoverTooltipLabel} title={linkHover.href}>
                {linkHoverLabel || linkHover.href}
              </span>
              <button
                type="button"
                className={styles.linkHoverTooltipRemove}
                aria-label="Remover link"
                title="Remover link"
                onMouseDown={(event) => event.preventDefault()}
                onClick={removeHoveredLink}
              >
                <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
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
}))

export default MarkdownWysiwygComposer
