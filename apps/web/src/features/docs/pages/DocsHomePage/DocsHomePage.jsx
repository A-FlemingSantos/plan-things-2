import { Link } from 'react-router-dom'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import CustomScrollArea from '../../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import { buildDocsPath } from '../../../../shared/config/routes.js'
import {
  DOCS_LIBRARY,
  getDocCover,
  getRecentDocs,
} from '../../data/docsContent.js'
import styles from './DocsHomePage.module.css'

const RECENT_DOCS = getRecentDocs(4)

function DocMeta({ category, dateLabel }) {
  return (
    <p className={styles.meta}>
      <span>{category}</span>
      <span className={styles.metaSep} aria-hidden="true">·</span>
      <span>{dateLabel}</span>
    </p>
  )
}

function EditorAvatars({ contributors = [] }) {
  if (contributors.length === 0) return null

  const names = contributors.map((person) => person.name).join(', ')

  return (
    <ul className={styles.avatarStack} aria-label={`Editado por ${names}`}>
      {contributors.map((person) => (
        <li key={person.id} className={styles.avatarItem}>
          <span className={styles.avatar} title={person.name} aria-hidden="true">
            {person.initials}
          </span>
        </li>
      ))}
    </ul>
  )
}

function RecentDocItem({ doc, index }) {
  const cover = getDocCover(doc)

  return (
    <Link
      to={buildDocsPath(doc.id)}
      className={styles.recentItem}
      style={{ '--reveal-delay': `${80 + index * 40}ms` }}
    >
      <span
        className={styles.recentThumb}
        style={cover ? { backgroundImage: cover.gradient } : undefined}
        aria-hidden="true"
      />
      <span className={styles.recentCopy}>
        <span className={styles.itemTitle}>{doc.title}</span>
        <span className={styles.itemFooter}>
          <DocMeta category={doc.category} dateLabel={doc.dateLabel} />
          <EditorAvatars contributors={doc.contributors} />
        </span>
      </span>
    </Link>
  )
}

function LibraryDocCard({ doc, index }) {
  const cover = getDocCover(doc)

  return (
    <Link
      to={buildDocsPath(doc.id)}
      className={styles.libraryCard}
      style={{ '--reveal-delay': `${160 + index * 50}ms` }}
    >
      <span
        className={styles.libraryMedia}
        style={cover ? { backgroundImage: cover.gradient } : undefined}
        role="img"
        aria-label={cover?.alt ?? doc.title}
      />
      <span className={styles.libraryCopy}>
        <span className={styles.itemTitle}>{doc.title}</span>
        <span className={styles.itemFooter}>
          <DocMeta category={doc.category} dateLabel={doc.dateLabel} />
          <EditorAvatars contributors={doc.contributors} />
        </span>
      </span>
    </Link>
  )
}

export default function DocsHomePage() {
  return (
    <AppThemeScope>
      <ProductAppShell contentClassName={styles.page} contentTag="main">
        <CustomScrollArea
          className={styles.scroll}
          viewportClassName={styles.viewport}
          refreshKey="docs-home"
        >
          <div className={styles.inner}>
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
                {RECENT_DOCS.map((doc, index) => (
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
                  {DOCS_LIBRARY.length} docs
                </span>
              </header>
              <div className={styles.libraryGrid}>
                {DOCS_LIBRARY.map((doc, index) => (
                  <LibraryDocCard key={doc.id} doc={doc} index={index} />
                ))}
              </div>
            </section>
          </div>
        </CustomScrollArea>
      </ProductAppShell>
    </AppThemeScope>
  )
}
