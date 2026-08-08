import { SquarePen } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import { buildDocsPath } from '../../../../shared/config/routes.js'
import DocumentCoverSurface from '../../components/DocumentCoverSurface.jsx'
import { DocsProvider, useDocs } from '../../context/DocsContext.jsx'
import { hasDocumentCover } from '../../utils/documentCover.js'
import styles from './DocsHomePage.module.css'

function DocMeta({ role, updatedAt }) {
  return (
    <p className={styles.meta}>
      <span>{role === 'OWNER' ? 'Seu documento' : 'Compartilhado'}</span>
      <span className={styles.metaSep} aria-hidden="true">·</span>
      <span>{updatedAt?.text ?? 'Agora'}</span>
    </p>
  )
}

function RecentDocItem({ doc, index }) {
  const hasCover = hasDocumentCover(doc.coverImageId)

  return (
    <Link
      to={buildDocsPath(doc.id)}
      className={`${styles.recentItem} ${hasCover ? '' : styles.recentItemNoCover}`}
      style={{ '--reveal-delay': `${80 + index * 40}ms` }}
    >
      {hasCover ? (
        <DocumentCoverSurface
          coverImageId={doc.coverImageId}
          className={styles.recentThumb}
          aria-hidden="true"
        />
      ) : null}
      <span className={styles.recentCopy}>
        <span className={styles.itemTitle}>{doc.title}</span>
        <span className={styles.itemFooter}>
          <DocMeta role={doc.role} updatedAt={doc.updatedAt} />
        </span>
      </span>
    </Link>
  )
}

function LibraryDocCard({ doc, index }) {
  const hasCover = hasDocumentCover(doc.coverImageId)

  return (
    <Link
      to={buildDocsPath(doc.id)}
      className={`${styles.libraryCard} ${hasCover ? '' : styles.libraryCardNoCover}`}
      style={{ '--reveal-delay': `${160 + index * 50}ms` }}
    >
      {hasCover ? (
        <DocumentCoverSurface
          coverImageId={doc.coverImageId}
          className={styles.libraryMedia}
          role="img"
          aria-label={doc.title}
        />
      ) : null}
      <span className={styles.libraryCopy}>
        <span className={styles.itemTitle}>{doc.title}</span>
        <span className={styles.itemFooter}>
          <DocMeta role={doc.role} updatedAt={doc.updatedAt} />
        </span>
      </span>
    </Link>
  )
}

function DocsHomeContent() {
  const navigate = useNavigate()
  const { createDocument, documents, error, isLoading } = useDocs()
  const recentDocs = documents.slice(0, 4)
  const libraryDocs = documents

  const createAndOpenDocument = async () => {
    const document = await createDocument()
    navigate(buildDocsPath(document.document.id))
  }

  return (
    <AppThemeScope>
      <ProductAppShell contentClassName={styles.page} contentTag="main">
        <CustomScrollArea
          className={styles.scroll}
          viewportClassName={styles.viewport}
          refreshKey="docs-home"
        >
          <div className={styles.inner}>
            <div className={styles.pageToolbar}>
              <button
                type="button"
                className={styles.writeButton}
                onClick={createAndOpenDocument}
              >
                <SquarePen size={15} strokeWidth={1.6} aria-hidden="true" />
                Escrever
              </button>
            </div>

            <section className={styles.section} aria-labelledby="docs-recent-heading">
              <header className={styles.sectionHeader}>
                <h2 id="docs-recent-heading" className={styles.sectionTitle}>
                  Atualizadas recentemente
                </h2>
                <a className={styles.sectionLink} href="#docs-library">
                  Veja mais
                </a>
              </header>
              <div className={styles.recentGrid}>
                {recentDocs.map((doc, index) => (
                  <RecentDocItem key={doc.id} doc={doc} index={index} />
                ))}
              </div>
            </section>

            <section
              id="docs-library"
              className={styles.section}
              aria-labelledby="docs-library-heading"
            >
              <header className={styles.sectionHeader}>
                <h2 id="docs-library-heading" className={styles.sectionTitle}>
                  Biblioteca
                </h2>
                <span className={styles.sectionLinkMuted}>
                  {documents.length} docs
                </span>
              </header>
              {isLoading ? <p className={styles.sectionLinkMuted}>Carregando docs…</p> : null}
              {error ? <p className={styles.sectionLinkMuted}>Não foi possível carregar os documentos.</p> : null}
              {!isLoading && !error ? (
                <div className={styles.libraryGrid}>
                  {libraryDocs.map((doc, index) => (
                    <LibraryDocCard key={doc.id} doc={doc} index={index} />
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </CustomScrollArea>
      </ProductAppShell>
    </AppThemeScope>
  )
}

export default function DocsHomePage() {
  return (
    <DocsProvider>
      <DocsHomeContent />
    </DocsProvider>
  )
}
