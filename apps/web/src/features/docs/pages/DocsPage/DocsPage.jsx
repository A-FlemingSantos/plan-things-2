import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Share,
  Trash2,
} from 'lucide-react'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import { getSectionOffsetTop } from '../../../../shared/hooks/useSectionScrollIndicator.js'
import {
  DOCS_LIBRARY,
  getDocById,
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
  const [activeDocId, setActiveDocId] = useState(DOCS_LIBRARY[0].id)
  const [activeSectionId, setActiveSectionId] = useState(DOCS_LIBRARY[0].sections[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [indexOpen, setIndexOpen] = useState(true)
  const [docsOpen, setDocsOpen] = useState(true)
  const articleViewportRef = useRef(null)

  const activeDoc = useMemo(() => getDocById(activeDocId), [activeDocId])

  const outline = useMemo(() => {
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

  const openDoc = (docId) => {
    const nextDoc = getDocById(docId)
    setSearchQuery('')
    setActiveDocId(nextDoc.id)
    setActiveSectionId(nextDoc.sections[0]?.id ?? '')
    articleViewportRef.current?.scrollTo({ top: 0 })
  }

  const goToSection = (sectionId) => {
    setActiveSectionId(sectionId)

    const run = () => {
      scrollViewportToSection(articleViewportRef.current, sectionId)
    }

    requestAnimationFrame(run)
  }

  const layoutClassName = [
    styles.layout,
    indexOpen ? '' : styles.layoutIndexCollapsed,
    docsOpen ? '' : styles.layoutDocsCollapsed,
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

          <section className={styles.articlePane} aria-label="Documento">
            <CustomScrollArea
              className={styles.articleScroll}
              viewportClassName={styles.articleViewport}
              viewportRef={articleViewportRef}
              refreshKey={`docs:${activeDocId}:${indexOpen}:${docsOpen}`}
            >
              <div className={styles.articleInner}>
                <header className={styles.toolbar}>
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
                  <div className={styles.toolbarActions}>
                    <button type="button" className={styles.iconButton} aria-label="Compartilhar" disabled>
                      <Share size={15} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                    <button type="button" className={styles.iconButton} aria-label="Excluir" disabled>
                      <Trash2 size={15} strokeWidth={1.6} aria-hidden="true" />
                    </button>
                    <button type="button" className={styles.iconButton} aria-label="Mais ações" disabled>
                      <MoreHorizontal size={15} strokeWidth={1.6} aria-hidden="true" />
                    </button>
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
          </section>

          <aside
            id="docs-library-pane"
            className={`${styles.relatedPane} ${docsOpen ? '' : styles.sidePaneCollapsed}`}
            aria-label="Documentos"
          >
            <div className={styles.paneHeader}>
              {docsOpen ? <p className={styles.relatedLabel}>Docs</p> : null}
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
              className={styles.paneBody}
              aria-hidden={!docsOpen}
              {...(!docsOpen ? { inert: '' } : {})}
            >
              <div className={styles.relatedList}>
                {DOCS_LIBRARY.map((doc) => {
                  const thumb = doc.sections.find((section) => section.image)?.image
                  const selected = doc.id === activeDocId
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
            </div>
          </aside>
        </div>
      </ProductAppShell>
    </AppThemeScope>
  )
}
