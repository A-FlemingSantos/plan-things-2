import { Link } from 'react-router-dom'
import { ROUTES } from '../../../shared/config/routes.js'

export default function InfoPage({ eyebrow, title, description, primaryLabel, primaryHref }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
        background: 'var(--color-white)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          display: 'grid',
          gap: '16px',
          textAlign: 'left',
        }}
      >
        <p style={{ fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-gray-400)' }}>
          {eyebrow}
        </p>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.04em', fontWeight: 'var(--font-weight-regular)' }}>
          {title}
        </h1>
        <p style={{ color: 'var(--color-gray-600)', maxWidth: '48ch' }}>
          {description}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          <Link
            to={primaryHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '48px',
              padding: '0 18px',
              borderRadius: '999px',
              background: 'var(--color-black)',
              color: 'var(--color-white)',
            }}
          >
            {primaryLabel}
          </Link>
          <Link
            to={ROUTES.home}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '48px',
              padding: '0 18px',
              borderRadius: '999px',
              border: '1px solid var(--color-gray-200)',
            }}
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  )
}
