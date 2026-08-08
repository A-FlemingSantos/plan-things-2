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
  Pencil,
  Search,
  Share,
  Trash2,
} from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import { buildDocsPath, ROUTES } from '../../../../shared/config/routes.js'
import { getSectionOffsetTop } from '../../../../shared/hooks/useSectionScrollIndicator.js'
import {
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
  const articleViewportRef = useRef(null)
  const moreMenuRef = useRef(null)

  useEffect(() => {
    if (!activeDoc) return
    setSearchQuery('')
    setActiveSectionId(activeDoc.sections[0]?.id ?? '')
    setMoreMenuOpen(false)
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
                    <h1 className={styles.docTitle}>{activeDoc.title}</h1>
                    <p className={styles.docDescription}>{activeDoc.description}</p>
                    <p className={styles.docMeta}>{activeDoc.publishedLabel}</p>
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
                  </ul>

                  <div className={styles.body}>
                    {activeDoc.sections.map((section) => (
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
                    ))}
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
