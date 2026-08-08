import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Copy,
  Download,
  Image,
  Link2,
  MoreHorizontal,
  MoveLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
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
import { getSectionOffsetTop } from '../../../../shared/hooks/useSectionScrollIndicator.js'
import { buildDocsPath, ROUTES } from '../../../../shared/config/routes.js'
import MarkdownWysiwygComposer from '../../components/MarkdownWysiwygComposer.jsx'
import MarkdownContent from '../../components/MarkdownContent.jsx'
import AddDocumentMemberMenu from '../../components/AddDocumentMemberMenu.jsx'
import DocumentCoverMenu from '../../components/DocumentCoverMenu.jsx'
import DocumentCoverSurface from '../../components/DocumentCoverSurface.jsx'
import { DocsProvider, useDocs } from '../../context/DocsContext.jsx'
import { hasDocumentCover } from '../../utils/documentCover.js'
import { formatDocumentMeta } from '../../utils/docVisuals.js'
import styles from './DocsPage.module.css'

const ICON_STROKE = 1.6

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function ContributorAvatar({ name }) {
  return <span className={styles.avatar} aria-hidden="true" title={name}>{getInitials(name)}</span>
}

function markdownHeadings(value = '') {
  let headingIndex = 0
  return value
    .split('\n')
    .map((line, lineIndex) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/)
      if (!match) return null
      const entry = {
        id: `heading-${lineIndex}`,
        label: match[2],
        lineIndex,
        headingIndex,
      }
      headingIndex += 1
      return entry
    })
    .filter(Boolean)
}

function scrollViewportToTarget(viewport, target) {
  if (!viewport || !target) return false
  const offsetTop = getSectionOffsetTop(viewport, target)
  viewport.scrollTo({
    top: Math.max(0, offsetTop - 20),
    behavior: 'smooth',
  })
  return true
}

function DocsPageContent() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const { accessToken, currentUser } = useAuth()
  const { setPageBreadcrumbLabel } = useAppChrome()
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
  const articleViewportRef = useRef(null)
  const moreMenuRef = useRef(null)
  const coverMenuRef = useRef(null)
  const deleteMenuRef = useRef(null)
  const memberMenuRef = useRef(null)
  const titleInputRef = useRef(null)
  const savedDraftRef = useRef('')

  const canEdit = details?.document?.role !== 'VIEWER'
  const headings = useMemo(() => markdownHeadings(draft.contentMarkdown), [draft.contentMarkdown])
  const outline = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return headings.filter((heading) => !query || heading.label.toLowerCase().includes(query))
  }, [headings, searchQuery])
  const draftSignature = JSON.stringify(draft)
  const docMeta = formatDocumentMeta(details?.document?.updatedAt)

  const applyDocument = (document) => {
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
    setActiveHeadingIndex(0)
    setSearchQuery('')
    setMoreMenuOpen(false)
    setMemberMenuOpen(false)
    articleViewportRef.current?.scrollTo({ top: 0 })
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
        if (active) applyDocument(document)
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
      saveDocument(details.document.id, {
        title: draft.title,
        description: draft.description,
        contentMarkdown: draft.contentMarkdown,
        coverImageId: draft.coverImageId,
        expectedVersion: draft.version,
      })
        .then((document) => {
          applyDocument(document)
        })
        .catch((error) => {
          if (error.currentDocument) applyDocument(error.currentDocument)
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
    if (outline.length === 0) return
    if (outline.some((heading) => heading.headingIndex === activeHeadingIndex)) return
    setActiveHeadingIndex(outline[0].headingIndex)
  }, [activeHeadingIndex, outline])

  useEffect(() => {
    const viewport = articleViewportRef.current
    if (!viewport || outline.length === 0) return undefined

    const targets = outline.map((heading) => (
      viewport.querySelector(`[data-doc-heading="${heading.headingIndex}"]`)
    )).filter(Boolean)

    if (targets.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)
        if (visible.length === 0) return
        const index = Number(visible[0].target.getAttribute('data-doc-heading'))
        if (Number.isNaN(index)) return
        const match = outline.find((heading) => heading.headingIndex === index)
        if (match) setActiveHeadingIndex(match.headingIndex)
      },
      { root: viewport, rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [canEdit, draft.contentMarkdown, outline])

  useEffect(() => {
    if (!canEdit || draft.title) return undefined
    requestAnimationFrame(() => titleInputRef.current?.focus())
    return undefined
  }, [canEdit, details?.document?.id, draft.title])

  const goToHeading = (heading) => {
    setActiveHeadingIndex(heading.headingIndex)
    const viewport = articleViewportRef.current
    const target = viewport?.querySelector(`[data-doc-heading="${heading.headingIndex}"]`)
    scrollViewportToTarget(viewport, target)
  }

  const addComment = async ({ body, quotedText, selectionStart, selectionEnd }) => {
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
  }

  const removeComment = async (commentId) => {
    try {
      await apiRequest(`/api/documents/${details.document.id}/comments/${commentId}`, {
        method: 'DELETE',
        token: accessToken,
      })
      setComments((current) => current.filter((comment) => comment.id !== commentId))
    } catch {
      // keep UI unchanged on failure
    }
  }

  const canDeleteComment = (comment) => (
    comment.author?.id === currentUser?.id || details.document.role === 'OWNER'
  )

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
              <nav className={styles.indexNav}>
                {outline.map((heading) => {
                  const active = heading.headingIndex === activeHeadingIndex
                  return (
                    <button
                      key={heading.id}
                      type="button"
                      className={`${styles.indexItem} ${active ? styles.indexItemActive : ''}`}
                      aria-current={active ? 'location' : undefined}
                      onClick={() => goToHeading(heading)}
                    >
                      {heading.label}
                    </button>
                  )
                })}
                {outline.length === 0 ? <p className={styles.indexEmpty}>Nenhuma seção encontrada.</p> : null}
              </nav>
            </div>
          </aside>

          <section className={`${styles.articlePane} ${docsOpen ? '' : styles.articlePaneDocsCollapsed}`} aria-label="Documento">
            <div className={styles.articleStage}>
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

                  <div className={styles.body}>
                    {canEdit ? (
                      <MarkdownWysiwygComposer
                        value={draft.contentMarkdown}
                        onChange={(contentMarkdown) => setDraft((current) => ({ ...current, contentMarkdown }))}
                        onAddComment={addComment}
                        onDeleteComment={removeComment}
                        canDeleteComment={canDeleteComment}
                        comments={comments}
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
                  <CustomScrollArea className={styles.relatedScroll} viewportClassName={styles.relatedViewport} refreshKey={`docs-library:${docsOpen}:${documents.length}`}>
                    <div className={styles.relatedList}>
                      {documents.map((document) => {
                        const selected = document.id === details.document.id
                        return (
                          <button
                            key={document.id}
                            type="button"
                            className={`${styles.relatedCard} ${selected ? styles.relatedCardSelected : ''}`}
                            aria-current={selected ? 'page' : undefined}
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

export default function DocsPage() {
  return <DocsProvider><DocsPageContent /></DocsProvider>
}
