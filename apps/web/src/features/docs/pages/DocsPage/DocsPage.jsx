import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Eye,
  Image,
  Link2,
  List,
  ListOrdered,
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
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import { useAppChrome } from '../../../../shared/context/AppChromeContext.jsx'
import { buildDocsPath, ROUTES } from '../../../../shared/config/routes.js'
import MarkdownWysiwygComposer from '../../components/MarkdownWysiwygComposer.jsx'
import MarkdownContent from '../../components/MarkdownContent.jsx'
import AddDocumentMemberMenu from '../../components/AddDocumentMemberMenu.jsx'
import DocumentCoverMenu from '../../components/DocumentCoverMenu.jsx'
import DocumentCoverSurface from '../../components/DocumentCoverSurface.jsx'
import { UnsplashLogo, YouTubeLogo } from '../../components/docsEmbedExtension.jsx'
import { DocsProvider, useDocs } from '../../context/DocsContext.jsx'
import { hasDocumentCover } from '../../utils/documentCover.js'
import { formatDocumentMeta } from '../../utils/docVisuals.js'
import {
  buildHeadingTree,
  extractMarkdownHeadings,
  findDocHeadingElement,
  listDocHeadingElements,
  resolveActiveDocHeadingIndex,
  resolveVisibleOutlineHeadingIndex,
  scrollViewportToHeading,
} from '../../utils/docsHeadings.js'
import { extractLinkedDocIds } from '../../utils/extractLinkedDocIds.js'
import styles from './DocsPage.module.css'

const ICON_STROKE = 1.6

const FORMAT_TOOLBAR_ACTIONS = [
  { id: 'bold', label: 'Negrito', kind: 'text', text: 'B', textClass: 'formatToolBold' },
  { id: 'italic', label: 'Itálico', kind: 'text', text: 'i', textClass: 'formatToolItalic' },
  { id: 'link', label: 'Inserir link', kind: 'icon', Icon: Link2 },
  { id: 'heading', label: 'Título', kind: 'headingMenu' },
  { id: 'quote', label: 'Citação', kind: 'icon', Icon: Quote },
  { id: 'bulletList', label: 'Lista', kind: 'icon', Icon: List },
  { id: 'orderedList', label: 'Lista numerada', kind: 'icon', Icon: ListOrdered },
  { id: 'code', label: 'Bloco de código', kind: 'icon', Icon: Code2 },
  { id: 'divider', label: 'Linha', kind: 'icon', Icon: Minus },
  { id: 'image', label: 'Imagem', kind: 'icon', Icon: Image },
  { id: 'unsplash', label: 'Unsplash', kind: 'custom', Icon: UnsplashLogo },
  { id: 'video', label: 'YouTube', kind: 'custom', Icon: YouTubeLogo },
]

const HEADING_FORMAT_OPTIONS = [
  { id: 'h1', label: 'Título', textClass: 'formatHeadingOptionH1' },
  { id: 'h2', label: 'Subtítulo', textClass: 'formatHeadingOptionH2' },
  { id: 'h3', label: 'Título 3', textClass: 'formatHeadingOptionH3' },
]

const FORMAT_TOOLBAR_EASE = [0.22, 1, 0.36, 1]
const MODE_PILL_LAYOUT_ID = 'docs-content-mode-pill'
const MODE_TOGGLE_SHORTCUT_LABEL = (
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
    ? '⌘⇧E'
    : 'Ctrl+Shift+E'
)

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function ContributorAvatar({ name }) {
  return <span className={styles.avatar} aria-hidden="true" title={name}>{getInitials(name)}</span>
}

function filterHeadingTree(nodes, query) {
  if (!query) return nodes
  return nodes.flatMap((node) => {
    const children = filterHeadingTree(node.children, query)
    if (node.label.toLowerCase().includes(query) || children.length > 0) {
      return [{ ...node, children }]
    }
    return []
  })
}

function DocsPageContent() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const { accessToken, currentUser } = useAuth()
  const { setPageBreadcrumbLabel } = useAppChrome()
  const reduceMotion = useReducedMotion()
  const {
    documents,
    loadDocument,
    createDocument,
    saveDocument,
    deleteDocument,
    duplicateDocument,
  } = useDocs()
  const [details, setDetails] = useState(null)
  const [draft, setDraft] = useState({ title: '', description: '', contentMarkdown: '', coverImageId: null, version: 0 })
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [indexOpen, setIndexOpen] = useState(true)
  const [docsOpen, setDocsOpen] = useState(false)
  const [memberMenuOpen, setMemberMenuOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [coverMenuOpen, setCoverMenuOpen] = useState(false)
  const [coverSaving, setCoverSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeHeadingIndex, setActiveHeadingIndex] = useState(0)
  const [expandedHeadingIds, setExpandedHeadingIds] = useState(() => new Set())
  const [contentMode, setContentMode] = useState('edit')
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false)
  const [toolbarAnimating, setToolbarAnimating] = useState(false)
  const articleViewportRef = useRef(null)
  const articleScrollTopRef = useRef(0)
  const activeHeadingIndexRef = useRef(0)
  const headingNavLockRef = useRef(null)
  const moreMenuRef = useRef(null)
  const coverMenuRef = useRef(null)
  const deleteMenuRef = useRef(null)
  const memberMenuRef = useRef(null)
  const titleInputRef = useRef(null)
  const savedDraftRef = useRef('')
  const composerRef = useRef(null)
  const formatLinkButtonRef = useRef(null)
  const headingMenuRef = useRef(null)

  const canEdit = details?.document?.role !== 'VIEWER'
  const isEditingContent = canEdit && contentMode === 'edit'

  const captureArticleScroll = useCallback(() => {
    const viewport = articleViewportRef.current
    if (!viewport) return
    articleScrollTopRef.current = viewport.scrollTop
  }, [])

  const restoreArticleScroll = useCallback(() => {
    const viewport = articleViewportRef.current
    if (!viewport) return
    const top = articleScrollTopRef.current
    const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)
    viewport.scrollTop = Math.min(Math.max(0, top), maxScrollTop)
  }, [])

  const changeContentMode = useCallback((mode) => {
    if (mode === contentMode) return
    captureArticleScroll()
    setHeadingMenuOpen(false)
    setContentMode(mode)
  }, [captureArticleScroll, contentMode])

  const toggleContentMode = useCallback(() => {
    changeContentMode(contentMode === 'edit' ? 'view' : 'edit')
  }, [changeContentMode, contentMode])

  const headings = useMemo(() => extractMarkdownHeadings(draft.contentMarkdown), [draft.contentMarkdown])
  const mentionedDocuments = useMemo(() => {
    const currentId = details?.document?.id ?? null
    const linkedIds = extractLinkedDocIds(draft.contentMarkdown, { excludeDocumentId: currentId })
    if (linkedIds.length === 0) return []
    const byId = new Map(documents.map((document) => [document.id, document]))
    return linkedIds.map((id) => byId.get(id)).filter(Boolean)
  }, [details?.document?.id, documents, draft.contentMarkdown])
  const linkableDocuments = useMemo(() => {
    const currentId = details?.document?.id
    if (!currentId) return documents
    return documents.filter((document) => document.id !== currentId)
  }, [details?.document?.id, documents])
  const outlineQuery = searchQuery.trim().toLowerCase()
  const outlineTree = useMemo(() => {
    const tree = buildHeadingTree(headings)
    return filterHeadingTree(tree, outlineQuery)
  }, [headings, outlineQuery])
  const outline = useMemo(() => {
    const flat = []
    const walk = (nodes) => {
      nodes.forEach((node) => {
        flat.push(node)
        if (node.children.length > 0) walk(node.children)
      })
    }
    walk(outlineTree)
    return flat
  }, [outlineTree])
  const searchExpandsAll = outlineQuery.length > 0
  const highlightedHeadingIndex = useMemo(() => (
    resolveVisibleOutlineHeadingIndex(outlineTree, activeHeadingIndex, {
      isExpanded: (headingId) => searchExpandsAll || expandedHeadingIds.has(headingId),
    })
  ), [activeHeadingIndex, expandedHeadingIds, outlineTree, searchExpandsAll])
  const draftSignature = JSON.stringify(draft)
  const docMeta = formatDocumentMeta(details?.document?.updatedAt)

  const applyDocument = (document, { resetView = false } = {}) => {
    const nextDraft = {
      title: document.document.title ?? '',
      description: document.document.description ?? '',
      contentMarkdown: document.contentMarkdown ?? '',
      coverImageId: document.document.coverImageId ?? null,
      version: document.document.versionNumber,
    }
    savedDraftRef.current = JSON.stringify(nextDraft)
    setDetails(document)
    setDraft(nextDraft)
    if (!resetView) return
    setActiveHeadingIndex(0)
    setSearchQuery('')
    setExpandedHeadingIds(new Set())
    setContentMode('edit')
    setHeadingMenuOpen(false)
    headingNavLockRef.current = null
    setMoreMenuOpen(false)
    setMemberMenuOpen(false)
    articleScrollTopRef.current = 0
    articleViewportRef.current?.scrollTo({ top: 0 })
  }

  const runFormatAction = (action) => {
    if (!isEditingContent) return
    setHeadingMenuOpen(false)
    if (action === 'link') {
      composerRef.current?.applyFormat('link', { anchorEl: formatLinkButtonRef.current })
      return
    }
    composerRef.current?.applyFormat(action)
  }

  // Autosave success: keep the live draft (and scroll position). Only bump
  // version/details so a mid-flight edit is not overwritten and the viewport
  // does not jump to the top on every keystroke debounce.
  const acknowledgeSavedDocument = (document, submitted) => {
    const nextVersion = document.document.versionNumber
    setDetails(document)
    setDraft((current) => {
      const stillSameAsSubmitted = (
        current.title === submitted.title
        && current.description === submitted.description
        && current.contentMarkdown === submitted.contentMarkdown
        && current.coverImageId === submitted.coverImageId
      )

      if (stillSameAsSubmitted) {
        const clean = { ...submitted, version: nextVersion }
        savedDraftRef.current = JSON.stringify(clean)
        return clean
      }

      savedDraftRef.current = JSON.stringify({
        title: document.document.title ?? '',
        description: document.document.description ?? '',
        contentMarkdown: document.contentMarkdown ?? '',
        coverImageId: document.document.coverImageId ?? null,
        version: nextVersion,
      })
      return { ...current, version: nextVersion }
    })
  }

  const refreshDocument = async () => {
    const document = await loadDocument(docId)
    applyDocument(document)
  }

  useEffect(() => {
    let active = true
    if (docId === 'new') {
      createDocument()
        .then((document) => navigate(buildDocsPath(document.document.id), { replace: true }))
        .catch(() => navigate(ROUTES.docs, { replace: true }))
      return () => { active = false }
    }

    setIsLoading(true)
    loadDocument(docId)
      .then((document) => {
        if (active) applyDocument(document, { resetView: true })
      })
      .catch(() => {
        if (active) navigate(ROUTES.docs, { replace: true })
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [createDocument, docId, loadDocument, navigate])

  useEffect(() => {
    if (!details?.document?.id) return undefined
    let active = true
    apiRequest(`/api/documents/${details.document.id}/comments`, { token: accessToken })
      .then((nextComments) => {
        if (active) setComments(nextComments)
      })
      .catch(() => {
        if (active) setComments([])
      })
    return () => { active = false }
  }, [accessToken, details?.document?.id])

  useEffect(() => {
    if (isLoading || !details?.document?.id) {
      setPageBreadcrumbLabel(null)
      return undefined
    }

    setPageBreadcrumbLabel(draft.title.trim() || 'Documento')
    return () => setPageBreadcrumbLabel(null)
  }, [details?.document?.id, draft.title, isLoading, setPageBreadcrumbLabel])

  useEffect(() => {
    if (!canEdit || !details || draftSignature === savedDraftRef.current) return undefined
    const timer = window.setTimeout(() => {
      const submitted = {
        title: draft.title,
        description: draft.description,
        contentMarkdown: draft.contentMarkdown,
        coverImageId: draft.coverImageId,
      }
      saveDocument(details.document.id, {
        ...submitted,
        expectedVersion: draft.version,
      })
        .then((document) => {
          acknowledgeSavedDocument(document, submitted)
        })
        .catch((error) => {
          if (error.currentDocument) applyDocument(error.currentDocument, { resetView: true })
        })
    }, 650)
    return () => window.clearTimeout(timer)
  }, [canEdit, details, draft, draftSignature, saveDocument])

  useEffect(() => {
    if (!deleteConfirmOpen) return undefined
    const onPointerDown = (event) => {
      if (deleteMenuRef.current?.contains(event.target)) return
      if (moreMenuRef.current?.contains(event.target)) return
      setDeleteConfirmOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDeleteConfirmOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [deleteConfirmOpen])

  useEffect(() => {
    if (!memberMenuOpen) return undefined
    const onPointerDown = (event) => {
      if (!memberMenuRef.current?.contains(event.target)) setMemberMenuOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMemberMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [memberMenuOpen])

  useEffect(() => {
    if (!moreMenuOpen) return undefined
    const onPointerDown = (event) => {
      if (!moreMenuRef.current?.contains(event.target)) setMoreMenuOpen(false)
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

  useEffect(() => {
    if (!coverMenuOpen) return undefined
    const onPointerDown = (event) => {
      if (!coverMenuRef.current?.contains(event.target)) setCoverMenuOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setCoverMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [coverMenuOpen])

  useEffect(() => {
    if (!headingMenuOpen) return undefined
    const onPointerDown = (event) => {
      if (!headingMenuRef.current?.contains(event.target)) setHeadingMenuOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setHeadingMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [headingMenuOpen])

  useEffect(() => {
    if (!isEditingContent) setHeadingMenuOpen(false)
  }, [isEditingContent])

  useEffect(() => {
    if (!canEdit) return undefined
    const onKeyDown = (event) => {
      if (event.isComposing) return
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.altKey) return
      if (event.key.toLowerCase() !== 'e') return
      event.preventDefault()
      toggleContentMode()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [canEdit, toggleContentMode])

  useEffect(() => {
    activeHeadingIndexRef.current = activeHeadingIndex
  }, [activeHeadingIndex])

  useEffect(() => {
    if (outline.length === 0) return
    if (outline.some((heading) => heading.headingIndex === activeHeadingIndex)) return
    setActiveHeadingIndex(outline[0].headingIndex)
  }, [activeHeadingIndex, outline])

  // Swap composer ↔ preview remounts heavy DOM; TipTap can also scroll the
  // caret to the start on mount. Keep the article scroll pinned through that.
  useLayoutEffect(() => {
    restoreArticleScroll()
    let frameTwo = null
    const frameOne = window.requestAnimationFrame(() => {
      restoreArticleScroll()
      frameTwo = window.requestAnimationFrame(restoreArticleScroll)
    })
    const timer = window.setTimeout(restoreArticleScroll, 48)
    return () => {
      window.cancelAnimationFrame(frameOne)
      if (frameTwo != null) window.cancelAnimationFrame(frameTwo)
      window.clearTimeout(timer)
    }
  }, [contentMode, isEditingContent, restoreArticleScroll])

  useLayoutEffect(() => {
    const viewport = articleViewportRef.current
    if (!viewport || headings.length === 0) return undefined

    const headingIndexes = new Set(headings.map((heading) => heading.headingIndex))
    let frameId = null
    // Read-only during scroll: mutating TipTap's DOM (retagging ids/attrs) every
    // frame forces editor reconciliation and makes the viewport feel stuck.
    let targets = listDocHeadingElements(viewport)

    const refreshTargetsIfStale = () => {
      if (targets.length === 0 || targets.some((element) => !element.isConnected)) {
        targets = listDocHeadingElements(viewport)
      }
      return targets
    }

    const syncActiveHeading = () => {
      frameId = null
      if (headingNavLockRef.current != null) return

      const nextTargets = refreshTargetsIfStale()
      if (nextTargets.length === 0) return

      const nextIndex = resolveActiveDocHeadingIndex(viewport, nextTargets)
      if (nextIndex == null || !headingIndexes.has(nextIndex)) return
      if (activeHeadingIndexRef.current === nextIndex) return
      // Keep scroll on the main thread; outline highlight can wait a frame.
      startTransition(() => {
        setActiveHeadingIndex(nextIndex)
      })
    }

    const onScroll = () => {
      articleScrollTopRef.current = viewport.scrollTop
      if (frameId != null) return
      frameId = window.requestAnimationFrame(syncActiveHeading)
    }

    viewport.addEventListener('scroll', onScroll, { passive: true })
    syncActiveHeading()

    return () => {
      viewport.removeEventListener('scroll', onScroll)
      if (frameId != null) window.cancelAnimationFrame(frameId)
    }
  }, [canEdit, details?.document?.id, draft.contentMarkdown, headings])

  useEffect(() => {
    if (!canEdit || draft.title) return undefined
    requestAnimationFrame(() => titleInputRef.current?.focus())
    return undefined
  }, [canEdit, details?.document?.id, draft.title])

  const goToHeading = (heading) => {
    const headingIndex = heading.headingIndex
    const viewport = articleViewportRef.current
    if (!viewport) {
      headingNavLockRef.current = headingIndex
      setActiveHeadingIndex(headingIndex)
      headingNavLockRef.current = null
      return false
    }

    // Lock + scroll against live nodes before React re-renders TipTap.
    // Updating active state first replaces heading DOM and yields offset 0.
    headingNavLockRef.current = headingIndex
    const target = findDocHeadingElement(viewport, headingIndex)
    const didScroll = scrollViewportToHeading(viewport, target, { behavior: 'smooth' })
    setActiveHeadingIndex(headingIndex)

    window.setTimeout(() => {
      if (headingNavLockRef.current === headingIndex) {
        headingNavLockRef.current = null
      }
    }, 450)

    return didScroll
  }

  const toggleHeadingExpanded = (headingId) => {
    setExpandedHeadingIds((current) => {
      const next = new Set(current)
      if (next.has(headingId)) next.delete(headingId)
      else next.add(headingId)
      return next
    })
  }

  const renderOutlineNodes = (nodes) => nodes.map((heading) => {
    const active = heading.headingIndex === highlightedHeadingIndex
    const hasChildren = heading.children.length > 0
    const expanded = searchExpandsAll || expandedHeadingIds.has(heading.id)
    const levelClass = heading.level === 1
      ? styles.indexItemLevel1
      : heading.level === 2
        ? styles.indexItemLevel2
        : styles.indexItemLevel3

    return (
      <div key={heading.id} className={styles.indexBranch}>
        <div className={`${styles.indexRow} ${active ? styles.indexRowActive : ''}`}>
          {hasChildren ? (
            <button
              type="button"
              className={`${styles.indexExpandButton} ${expanded ? styles.indexExpandButtonOpen : ''}`}
              aria-label={expanded ? `Recolher ${heading.label}` : `Expandir ${heading.label}`}
              aria-expanded={expanded}
              onClick={() => toggleHeadingExpanded(heading.id)}
            >
              <ChevronRight size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
            </button>
          ) : (
            <span className={styles.indexExpandSpacer} aria-hidden="true" />
          )}
          <button
            type="button"
            className={`${styles.indexItem} ${levelClass} ${active ? styles.indexItemActive : ''}`}
            aria-current={active ? 'location' : undefined}
            onClick={() => goToHeading(heading)}
          >
            {heading.label}
          </button>
        </div>
        {hasChildren ? (
          <div
            className={`${styles.indexChildren} ${expanded ? styles.indexChildrenOpen : ''}`}
            aria-hidden={!expanded}
            {...(!expanded ? { inert: '' } : {})}
          >
            <div className={styles.indexChildrenInner}>
              {renderOutlineNodes(heading.children)}
            </div>
          </div>
        ) : null}
      </div>
    )
  })

  const handleContentChange = useCallback((contentMarkdown) => {
    setDraft((current) => ({ ...current, contentMarkdown }))
  }, [])

  const addComment = useCallback(async ({ body, quotedText, selectionStart, selectionEnd }) => {
    if (!body?.trim()) return null
    try {
      const comment = await apiRequest(`/api/documents/${details.document.id}/comments`, {
        method: 'POST',
        token: accessToken,
        body: { body, quotedText, selectionStart, selectionEnd },
      })
      setComments((current) => [...current, comment])
      return comment
    } catch {
      return null
    }
  }, [accessToken, details?.document?.id])

  const removeComment = useCallback(async (commentId) => {
    try {
      await apiRequest(`/api/documents/${details.document.id}/comments/${commentId}`, {
        method: 'DELETE',
        token: accessToken,
      })
      setComments((current) => current.filter((comment) => comment.id !== commentId))
    } catch {
      // keep UI unchanged on failure
    }
  }, [accessToken, details?.document?.id])

  const canDeleteComment = useCallback((comment) => (
    comment.author?.id === currentUser?.id || details.document.role === 'OWNER'
  ), [currentUser?.id, details?.document?.role])

  const duplicate = async () => {
    setMoreMenuOpen(false)
    const copy = await duplicateDocument(details.document.id)
    navigate(buildDocsPath(copy.document.id))
  }

  const exportMarkdown = () => {
    setMoreMenuOpen(false)
    const blob = new Blob([draft.contentMarkdown], { type: 'text/markdown;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = `${draft.title || 'documento'}.md`
    anchor.click()
    URL.revokeObjectURL(href)
  }

  const renameDocument = () => {
    setMoreMenuOpen(false)
    requestAnimationFrame(() => titleInputRef.current?.focus())
  }

  const openDeleteConfirm = () => {
    setDeleteConfirmOpen(true)
  }

  const confirmRemove = async () => {
    setDeleteConfirmOpen(false)
    setMoreMenuOpen(false)
    await deleteDocument(details.document.id)
    navigate(ROUTES.docs)
  }

  const copyLink = async () => {
    setMoreMenuOpen(false)
    try {
      await navigator.clipboard?.writeText(window.location.href)
    } catch {
      // Clipboard may be unavailable.
    }
  }

  const selectCover = async (coverImageId) => {
    if (!details?.document?.id || coverSaving) return
    setCoverSaving(true)
    try {
      const document = await saveDocument(details.document.id, {
        title: draft.title,
        description: draft.description,
        contentMarkdown: draft.contentMarkdown,
        coverImageId: coverImageId || null,
        expectedVersion: draft.version,
      })
      applyDocument(document)
    } catch (error) {
      if (error.currentDocument) applyDocument(error.currentDocument)
    } finally {
      setCoverSaving(false)
    }
  }

  if (isLoading || !details) {
    return (
      <AppThemeScope>
        <ProductAppShell contentClassName={styles.page} contentTag="main">
          <div className={styles.articleInner}>Carregando documento…</div>
        </ProductAppShell>
      </AppThemeScope>
    )
  }

  const layoutClassName = [styles.layout, indexOpen ? '' : styles.layoutIndexCollapsed].filter(Boolean).join(' ')
  const docHeaderFields = canEdit ? (
    <>
      <input ref={titleInputRef} className={styles.docTitleInput} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Título" aria-label="Título do documento" />
      <input className={styles.docDescriptionInput} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Adicione um subtítulo..." aria-label="Subtítulo do documento" />
    </>
  ) : (
    <>
      <h1 className={styles.docTitle}>{draft.title}</h1>
      {draft.description ? <p className={styles.docDescription}>{draft.description}</p> : null}
      {docMeta ? <p className={styles.docMeta}>{docMeta}</p> : null}
    </>
  )

  return (
    <AppThemeScope>
      <ProductAppShell contentClassName={styles.page} contentTag="main">
        <div className={layoutClassName}>
          <aside id="docs-index-pane" className={`${styles.indexPane} ${indexOpen ? '' : styles.sidePaneCollapsed}`} aria-label="Índice do documento">
            <div className={styles.paneHeader}>
              {indexOpen ? <p className={styles.indexLabel}>Índice</p> : null}
              <button type="button" className={styles.paneToggle} aria-label={indexOpen ? 'Ocultar índice' : 'Mostrar índice'} aria-controls="docs-index-pane" aria-expanded={indexOpen} onClick={() => setIndexOpen((open) => !open)}>
                {indexOpen ? <PanelLeftClose size={15} strokeWidth={ICON_STROKE} aria-hidden="true" /> : <PanelLeftOpen size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />}
              </button>
            </div>
            <div className={styles.paneBody} aria-hidden={!indexOpen} {...(!indexOpen ? { inert: '' } : {})}>
              <nav className={styles.indexNav} aria-label="Seções do documento">
                {renderOutlineNodes(outlineTree)}
                {outlineTree.length === 0 ? <p className={styles.indexEmpty}>Nenhuma seção encontrada.</p> : null}
              </nav>
            </div>
          </aside>

          <section className={`${styles.articlePane} ${docsOpen ? '' : styles.articlePaneDocsCollapsed}`} aria-label="Documento">
            <div className={`${styles.articleStage} ${canEdit ? styles.articleStageWithFormatToolbar : ''}`}>
              {canEdit ? (
                <div className={styles.docChromeFloat}>
                  <AnimatePresence initial={false}>
                    {isEditingContent ? (
                      <motion.div
                        key="docs-format-toolbar"
                        className={`${styles.formatToolbarMotion} ${toolbarAnimating ? styles.formatToolbarMotionClipping : ''}`}
                        initial={reduceMotion ? false : { width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
                        transition={reduceMotion
                          ? { duration: 0 }
                          : { duration: 0.32, ease: FORMAT_TOOLBAR_EASE }}
                        onAnimationStart={() => setToolbarAnimating(true)}
                        onAnimationComplete={() => setToolbarAnimating(false)}
                      >
                        <div className={styles.formatToolbarFloat} role="toolbar" aria-label="Formatação do documento">
                          <div className={styles.formatToolbarGroup}>
                            {FORMAT_TOOLBAR_ACTIONS.map((action) => {
                              if (action.kind === 'headingMenu') {
                                return (
                                  <div key={action.id} className={styles.formatHeadingMenu} ref={headingMenuRef}>
                                    <button
                                      type="button"
                                      className={[
                                        styles.formatToolButton,
                                        styles.formatHeadingTrigger,
                                        headingMenuOpen ? styles.formatToolButtonActive : '',
                                      ].filter(Boolean).join(' ')}
                                      title={action.label}
                                      aria-label={action.label}
                                      aria-haspopup="menu"
                                      aria-expanded={headingMenuOpen}
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => setHeadingMenuOpen((open) => !open)}
                                    >
                                      <span className={styles.formatToolHeadingLabel} aria-hidden="true">T</span>
                                      <ChevronDown size={12} strokeWidth={ICON_STROKE} aria-hidden="true" />
                                    </button>
                                    {headingMenuOpen ? (
                                      <div className={styles.formatHeadingPanel} role="menu" aria-label="Estilos de título">
                                        {HEADING_FORMAT_OPTIONS.map((option) => (
                                          <button
                                            key={option.id}
                                            type="button"
                                            role="menuitem"
                                            className={`${styles.formatHeadingOption} ${styles[option.textClass]}`}
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => runFormatAction(option.id)}
                                          >
                                            {option.label}
                                          </button>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                )
                              }

                              const buttonClass = [
                                styles.formatToolButton,
                                action.textClass ? styles[action.textClass] : '',
                              ].filter(Boolean).join(' ')
                              return (
                                <button
                                  key={action.id}
                                  ref={action.id === 'link' ? formatLinkButtonRef : undefined}
                                  type="button"
                                  className={buttonClass}
                                  title={action.label}
                                  aria-label={action.label}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => runFormatAction(action.id)}
                                >
                                  {action.kind === 'text' ? (
                                    action.text
                                  ) : (
                                    <action.Icon size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  <div className={styles.modePillGroup} role="group" aria-label={`Modo do documento (${MODE_TOGGLE_SHORTCUT_LABEL})`}>
                    <button
                      type="button"
                      className={`${styles.modePill} ${contentMode === 'edit' ? styles.modePillActive : ''}`}
                      title={`Editar (${MODE_TOGGLE_SHORTCUT_LABEL})`}
                      aria-label={`Editar (${MODE_TOGGLE_SHORTCUT_LABEL})`}
                      aria-pressed={contentMode === 'edit'}
                      onClick={() => changeContentMode('edit')}
                    >
                      {contentMode === 'edit' ? (
                        <motion.span
                          layoutId={MODE_PILL_LAYOUT_ID}
                          className={styles.modePillActiveFill}
                          transition={reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 420, damping: 34 }}
                          aria-hidden="true"
                        />
                      ) : null}
                      <Pencil size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={`${styles.modePill} ${contentMode === 'view' ? styles.modePillActive : ''}`}
                      title={`Visualizar (${MODE_TOGGLE_SHORTCUT_LABEL})`}
                      aria-label={`Visualizar (${MODE_TOGGLE_SHORTCUT_LABEL})`}
                      aria-pressed={contentMode === 'view'}
                      onClick={() => changeContentMode('view')}
                    >
                      {contentMode === 'view' ? (
                        <motion.span
                          layoutId={MODE_PILL_LAYOUT_ID}
                          className={styles.modePillActiveFill}
                          transition={reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 420, damping: 34 }}
                          aria-hidden="true"
                        />
                      ) : null}
                      <Eye size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : null}
              <CustomScrollArea
                className={styles.articleScroll}
                viewportClassName={styles.articleViewport}
                viewportRef={articleViewportRef}
                refreshKey={`docs:${details.document.id}:${indexOpen}:${docsOpen}`}
              >
                <div className={styles.articleInner}>
                  <header className={styles.toolbar}>
                    <div className={styles.toolbarLeading}>
                      <Link to={ROUTES.docs} className={styles.iconButton} aria-label="Voltar para Docs">
                        <MoveLeft size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                      </Link>
                      <label className={styles.searchField}>
                        <Search size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar nesta doc..." aria-label="Buscar seções nesta documentação" />
                      </label>
                    </div>
                    <div className={styles.toolbarActions}>
                      {canEdit ? (
                        <div className={styles.coverMenuWrap} ref={coverMenuRef}>
                          <button
                            type="button"
                            className={`${styles.iconButton} ${coverMenuOpen ? styles.iconButtonActive : ''}`}
                            aria-label="Escolher capa"
                            aria-haspopup="dialog"
                            aria-expanded={coverMenuOpen}
                            onClick={() => {
                              setDeleteConfirmOpen(false)
                              setMoreMenuOpen(false)
                              setCoverMenuOpen((open) => !open)
                            }}
                          >
                            <Image size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                          </button>
                          <DocumentCoverMenu
                            open={coverMenuOpen}
                            onClose={() => setCoverMenuOpen(false)}
                            onSelectCover={selectCover}
                            busy={coverSaving}
                            styles={styles}
                          />
                        </div>
                      ) : null}
                      <button type="button" className={styles.iconButton} aria-label="Compartilhar link" onClick={copyLink}>
                        <Share size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                      </button>
                      {details.document.role === 'OWNER' ? (
                        <div className={styles.moreMenu} ref={deleteMenuRef}>
                          <button
                            type="button"
                            className={`${styles.iconButton} ${deleteConfirmOpen && !moreMenuOpen ? styles.iconButtonActive : ''}`}
                            aria-label="Excluir"
                            aria-expanded={deleteConfirmOpen && !moreMenuOpen}
                            onClick={() => {
                              setMoreMenuOpen(false)
                              setDeleteConfirmOpen((open) => !open)
                            }}
                          >
                            <Trash2 size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                          </button>
                          {deleteConfirmOpen && !moreMenuOpen ? (
                            <div className={styles.moreMenuPanel} role="group" aria-label="Confirmar exclusão">
                              <p className={styles.moreMenuConfirmText}>Excluir este documento?</p>
                              <button type="button" className={`${styles.moreMenuItem} ${styles.moreMenuItemDanger}`} onClick={confirmRemove}>
                                Excluir
                              </button>
                              <button type="button" className={styles.moreMenuItem} onClick={() => setDeleteConfirmOpen(false)}>
                                Cancelar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      <div className={styles.moreMenu} ref={moreMenuRef}>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${moreMenuOpen ? styles.iconButtonActive : ''}`}
                          aria-label="Mais ações"
                          aria-haspopup="menu"
                          aria-expanded={moreMenuOpen}
                          aria-controls="docs-more-menu"
                          onClick={() => {
                            setDeleteConfirmOpen(false)
                            setMoreMenuOpen((open) => !open)
                          }}
                        >
                          <MoreHorizontal size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />
                        </button>
                        {moreMenuOpen ? (
                          <div id="docs-more-menu" className={styles.moreMenuPanel} role="menu" aria-label="Mais ações da documentação">
                            {deleteConfirmOpen ? (
                              <>
                                <p className={styles.moreMenuConfirmText}>Excluir este documento?</p>
                                <button type="button" className={`${styles.moreMenuItem} ${styles.moreMenuItemDanger}`} onClick={confirmRemove}>
                                  <Trash2 size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                                  Excluir
                                </button>
                                <button type="button" className={styles.moreMenuItem} onClick={() => setDeleteConfirmOpen(false)}>
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                            <button type="button" className={styles.moreMenuItem} role="menuitem" onClick={duplicate}>
                              <Copy size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                              Duplicar
                            </button>
                            {canEdit ? (
                              <button type="button" className={styles.moreMenuItem} role="menuitem" onClick={renameDocument}>
                                <Pencil size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                                Renomear
                              </button>
                            ) : null}
                            <button type="button" className={styles.moreMenuItem} role="menuitem" onClick={exportMarkdown}>
                              <Download size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                              Exportar
                            </button>
                            <button type="button" className={styles.moreMenuItem} role="menuitem" onClick={copyLink}>
                              <Link2 size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                              Copiar link
                            </button>
                            {details.document.role === 'OWNER' ? (
                              <>
                                <div className={styles.moreMenuDivider} role="separator" />
                                <button type="button" className={`${styles.moreMenuItem} ${styles.moreMenuItemDanger}`} role="menuitem" onClick={openDeleteConfirm}>
                                  <Trash2 size={14} strokeWidth={ICON_STROKE} aria-hidden="true" />
                                  Excluir
                                </button>
                              </>
                            ) : null}
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </header>

                  {hasDocumentCover(draft.coverImageId) ? (
                    <div className={styles.docHero}>
                      <DocumentCoverSurface
                        coverImageId={draft.coverImageId}
                        className={styles.docCover}
                        role="img"
                        aria-label={`Capa de ${draft.title || 'documento'}`}
                      />
                      <div className={styles.docHeader}>{docHeaderFields}</div>
                    </div>
                  ) : (
                    <div className={styles.docHeader}>{docHeaderFields}</div>
                  )}

                  <ul className={styles.contributors} aria-label="Contribuidores">
                    {details.members.map((member) => (
                      <li key={member.userId} className={styles.contributor}>
                        <ContributorAvatar name={member.fullName} />
                        <div className={styles.contributorCopy}>
                          <span className={styles.contributorName}>{member.fullName}</span>
                          <span className={styles.contributorRole}>{member.role === 'OWNER' ? 'Proprietário' : member.role === 'EDITOR' ? 'Editor' : 'Leitor'}</span>
                        </div>
                      </li>
                    ))}
                    {details.document.role === 'OWNER' ? (
                      <li className={`${styles.contributor} ${styles.memberMenuWrap}`} ref={memberMenuRef}>
                        <button
                          type="button"
                          className={styles.addMemberButton}
                          aria-haspopup="dialog"
                          aria-expanded={memberMenuOpen}
                          onClick={() => setMemberMenuOpen((open) => !open)}
                        >
                          <span className={styles.addMemberAvatar} aria-hidden="true"><Plus size={14} strokeWidth={ICON_STROKE} /></span>
                          <span className={styles.contributorCopy}><span className={styles.contributorName}>Adicionar membro</span></span>
                        </button>
                        <AddDocumentMemberMenu
                          open={memberMenuOpen}
                          documentId={details.document.id}
                          onClose={() => setMemberMenuOpen(false)}
                          onInvited={refreshDocument}
                          styles={styles}
                        />
                      </li>
                    ) : null}
                  </ul>

                  <div className={styles.body} data-docs-body="">
                    {isEditingContent ? (
                      <MarkdownWysiwygComposer
                        ref={composerRef}
                        value={draft.contentMarkdown}
                        onChange={handleContentChange}
                        onAddComment={addComment}
                        onDeleteComment={removeComment}
                        canDeleteComment={canDeleteComment}
                        comments={comments}
                        linkableDocuments={linkableDocuments}
                        scrollTopRef={articleScrollTopRef}
                        placeholder="Uma palavra leva à outra..."
                        styles={styles}
                      />
                    ) : (
                      <MarkdownContent value={draft.contentMarkdown} styles={styles} />
                    )}
                  </div>
                </div>
              </CustomScrollArea>

              <aside id="docs-library-pane" className={`${styles.relatedPane} ${docsOpen ? '' : styles.relatedPaneCollapsed}`} aria-label="Documentos">
                <div className={styles.paneHeader}>
                  {docsOpen ? <p className={styles.relatedLabel}><Link to={ROUTES.docs} className={styles.relatedHomeLink}>Docs</Link></p> : null}
                  <button type="button" className={styles.paneToggle} aria-label={docsOpen ? 'Ocultar docs' : 'Mostrar docs'} aria-controls="docs-library-pane" aria-expanded={docsOpen} onClick={() => setDocsOpen((open) => !open)}>
                    {docsOpen ? <PanelRightClose size={15} strokeWidth={ICON_STROKE} aria-hidden="true" /> : <PanelRightOpen size={15} strokeWidth={ICON_STROKE} aria-hidden="true" />}
                  </button>
                </div>
                <div className={styles.relatedBody} aria-hidden={!docsOpen} {...(!docsOpen ? { inert: '' } : {})}>
                  <CustomScrollArea className={styles.relatedScroll} viewportClassName={styles.relatedViewport} refreshKey={`docs-library:${docsOpen}:${mentionedDocuments.length}`}>
                    <div className={styles.relatedList}>
                      {mentionedDocuments.length === 0 ? (
                        <p className={styles.relatedEmpty}>Nenhuma documentação mencionada</p>
                      ) : mentionedDocuments.map((document) => (
                        <button
                          key={document.id}
                          type="button"
                          className={styles.relatedCard}
                          onClick={() => navigate(buildDocsPath(document.id))}
                        >
                          {hasDocumentCover(document.coverImageId) ? (
                            <DocumentCoverSurface
                              coverImageId={document.coverImageId}
                              className={styles.relatedThumb}
                              aria-hidden="true"
                            />
                          ) : null}
                          <span className={styles.relatedTitle}>{document.title}</span>
                          <span className={styles.relatedExcerpt}>{document.description}</span>
                        </button>
                      ))}
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

export default function DocsPage() {
  return <DocsProvider><DocsPageContent /></DocsProvider>
}
