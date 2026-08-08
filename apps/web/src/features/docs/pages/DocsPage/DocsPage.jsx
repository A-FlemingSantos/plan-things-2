import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Copy,
  Download,
  Link2,
  MoreHorizontal,
  MoveLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
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
import { buildDocsPath, ROUTES } from '../../../../shared/config/routes.js'
import MarkdownContent from '../../components/MarkdownContent.jsx'
import MarkdownWysiwygComposer from '../../components/MarkdownWysiwygComposer.jsx'
import DocumentSharePopover from '../../components/DocumentSharePopover.jsx'
import { DocsProvider, useDocs } from '../../context/DocsContext.jsx'
import styles from './DocsPage.module.css'

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function ContributorAvatar({ name }) {
  return <span className={styles.avatar} aria-hidden="true" title={name}>{getInitials(name)}</span>
}

function markdownHeadings(value = '') {
  return value
    .split('\n')
    .map((line) => line.match(/^(#{1,3})\s+(.+)$/))
    .filter(Boolean)
    .map((match, index) => ({ id: `heading-${index}`, label: match[2] }))
}

function DocsPageContent() {
  const { docId } = useParams()
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const {
    documents,
    loadDocument,
    createDocument,
    saveDocument,
    deleteDocument,
    duplicateDocument,
  } = useDocs()
  const [details, setDetails] = useState(null)
  const [draft, setDraft] = useState({ title: '', description: '', contentMarkdown: '', version: 0 })
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')
  const [indexOpen, setIndexOpen] = useState(true)
  const [docsOpen, setDocsOpen] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const articleViewportRef = useRef(null)
  const savedDraftRef = useRef('')

  const canEdit = details?.document?.role !== 'VIEWER'
  const headings = useMemo(() => markdownHeadings(draft.contentMarkdown), [draft.contentMarkdown])
  const outline = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return headings
      .map((heading, index) => ({ ...heading, index }))
      .filter((heading) => !query || heading.label.toLowerCase().includes(query))
  }, [headings, searchQuery])
  const draftSignature = JSON.stringify(draft)

  const applyDocument = (document) => {
    const nextDraft = {
      title: document.document.title ?? '',
      description: document.document.description ?? '',
      contentMarkdown: document.contentMarkdown ?? '',
      version: document.document.versionNumber,
    }
    savedDraftRef.current = JSON.stringify(nextDraft)
    setDetails(document)
    setDraft(nextDraft)
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
    if (!canEdit || !details || draftSignature === savedDraftRef.current) return undefined
    setSaveStatus('Salvando…')
    const timer = window.setTimeout(() => {
      saveDocument(details.document.id, {
        title: draft.title,
        description: draft.description,
        contentMarkdown: draft.contentMarkdown,
        expectedVersion: draft.version,
      })
        .then((document) => {
          applyDocument(document)
          setSaveStatus('Salvo')
        })
        .catch((error) => {
          if (error.currentDocument) applyDocument(error.currentDocument)
          setSaveStatus(error?.message ?? 'Não foi possível salvar.')
        })
    }, 650)
    return () => window.clearTimeout(timer)
  }, [canEdit, details, draft, draftSignature, saveDocument])

  const goToHeading = (index) => {
    articleViewportRef.current
      ?.querySelectorAll('h1, h2, h3')
      ?.[index]
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    } catch (error) {
      setSaveStatus(error?.message ?? 'Não foi possível adicionar o comentário.')
      return null
    }
  }

  const duplicate = async () => {
    const copy = await duplicateDocument(details.document.id)
    navigate(buildDocsPath(copy.document.id))
  }

  const exportMarkdown = () => {
    const blob = new Blob([draft.contentMarkdown], { type: 'text/markdown;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = `${draft.title || 'documento'}.md`
    anchor.click()
    URL.revokeObjectURL(href)
  }

  const remove = async () => {
    if (!window.confirm('Excluir este documento?')) return
    await deleteDocument(details.document.id)
    navigate(ROUTES.docs)
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
  return (
    <AppThemeScope>
      <ProductAppShell contentClassName={styles.page} contentTag="main">
        <div className={layoutClassName}>
          <aside id="docs-index-pane" className={`${styles.indexPane} ${indexOpen ? '' : styles.sidePaneCollapsed}`} aria-label="Índice do documento">
            <div className={styles.paneHeader}>
              {indexOpen ? <p className={styles.indexLabel}>Índice</p> : null}
              <button type="button" className={styles.paneToggle} aria-label={indexOpen ? 'Ocultar índice' : 'Mostrar índice'} onClick={() => setIndexOpen((open) => !open)}>
                {indexOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
              </button>
            </div>
            <div className={styles.paneBody}>
              <nav className={styles.indexNav}>
                {outline.map((heading) => (
                  <button key={heading.id} type="button" className={styles.indexItem} onClick={() => goToHeading(heading.index)}>
                    {heading.label}
                  </button>
                ))}
                {outline.length === 0 ? <p className={styles.indexEmpty}>Nenhuma seção encontrada.</p> : null}
              </nav>
            </div>
          </aside>

          <section className={`${styles.articlePane} ${docsOpen ? '' : styles.articlePaneDocsCollapsed}`} aria-label="Documento">
            <div className={styles.articleStage}>
              <CustomScrollArea className={styles.articleScroll} viewportClassName={styles.articleViewport} viewportRef={articleViewportRef} refreshKey={`docs:${details.document.id}`}>
                <div className={styles.articleInner}>
                  <header className={styles.toolbar}>
                    <div className={styles.toolbarLeading}>
                      <Link to={ROUTES.docs} className={styles.iconButton} aria-label="Voltar para Docs"><MoveLeft size={15} /></Link>
                      <label className={styles.searchField}>
                        <Search size={15} aria-hidden="true" />
                        <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar nesta doc..." aria-label="Buscar seções nesta documentação" />
                      </label>
                    </div>
                    <div className={styles.toolbarActions}>
                      <button type="button" className={styles.iconButton} aria-label="Compartilhar" onClick={() => setShareOpen((open) => !open)}><Share size={15} /></button>
                      {details.document.role === 'OWNER' ? <button type="button" className={styles.iconButton} aria-label="Excluir" onClick={remove}><Trash2 size={15} /></button> : null}
                      <div className={styles.moreMenu}>
                        <button type="button" className={styles.iconButton} aria-label="Mais ações" onClick={() => setMoreMenuOpen((open) => !open)}><MoreHorizontal size={15} /></button>
                        {moreMenuOpen ? (
                          <div className={styles.moreMenuPanel} role="menu">
                            <button type="button" className={styles.moreMenuItem} role="menuitem" onClick={duplicate}><Copy size={14} />Duplicar</button>
                            <button type="button" className={styles.moreMenuItem} role="menuitem" onClick={exportMarkdown}><Download size={14} />Exportar</button>
                            <button type="button" className={styles.moreMenuItem} role="menuitem" onClick={() => navigator.clipboard?.writeText(window.location.href)}><Link2 size={14} />Copiar link</button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </header>
                  {shareOpen ? <DocumentSharePopover document={details} onClose={() => setShareOpen(false)} onMembersChange={refreshDocument} styles={styles} /> : null}

                  <div className={styles.docHeader}>
                    {canEdit ? (
                      <>
                        <input className={styles.docTitleInput} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Título" aria-label="Título do documento" />
                        <input className={styles.docDescriptionInput} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Adicione um subtítulo..." aria-label="Subtítulo do documento" />
                      </>
                    ) : (
                      <>
                        <h1 className={styles.docTitle}>{draft.title}</h1>
                        {draft.description ? <p className={styles.docDescription}>{draft.description}</p> : null}
                      </>
                    )}
                  </div>

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
                    {canEdit ? (
                      <li className={styles.contributor}>
                        <button type="button" className={styles.addMemberButton} onClick={() => setShareOpen(true)}>
                          <span className={styles.addMemberAvatar} aria-hidden="true"><Plus size={14} /></span>
                          <span className={styles.contributorCopy}><span className={styles.contributorName}>Adicionar membro</span></span>
                        </button>
                      </li>
                    ) : null}
                  </ul>

                  <div className={styles.body}>
                    {canEdit ? (
                      <MarkdownWysiwygComposer
                        value={draft.contentMarkdown}
                        onChange={(contentMarkdown) => setDraft((current) => ({ ...current, contentMarkdown }))}
                        onAddComment={addComment}
                        comments={comments}
                        placeholder="Uma palavra leva à outra..."
                        styles={styles}
                      />
                    ) : <MarkdownContent value={draft.contentMarkdown} styles={styles} />}
                  </div>
                </div>
              </CustomScrollArea>

              <aside id="docs-library-pane" className={`${styles.relatedPane} ${docsOpen ? '' : styles.relatedPaneCollapsed}`} aria-label="Documentos">
                <div className={styles.paneHeader}>
                  {docsOpen ? <p className={styles.relatedLabel}><Link to={ROUTES.docs} className={styles.relatedHomeLink}>Docs</Link></p> : null}
                  <button type="button" className={styles.paneToggle} aria-label={docsOpen ? 'Ocultar docs' : 'Mostrar docs'} onClick={() => setDocsOpen((open) => !open)}>
                    {docsOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                  </button>
                </div>
                <div className={styles.relatedBody}>
                  <CustomScrollArea className={styles.relatedScroll} viewportClassName={styles.relatedViewport} refreshKey={`docs-library:${documents.length}`}>
                    <div className={styles.relatedList}>
                      {documents.map((document) => (
                        <button key={document.id} type="button" className={`${styles.relatedCard} ${document.id === details.document.id ? styles.relatedCardSelected : ''}`} onClick={() => navigate(buildDocsPath(document.id))}>
                          <span className={styles.relatedThumb} aria-hidden="true" />
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
