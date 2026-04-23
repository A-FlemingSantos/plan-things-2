import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { usePlans } from '../../context/PlansContext.jsx'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import { buildWorkspaceBoardPath, ROUTES } from '../../../../shared/config/routes.js'
import styles from './InviteAccept.module.css'

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity=".35" />
      <rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55" />
      <rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75" />
    </svg>
  )
}

export default function InviteAccept() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { accessToken, isAuthenticated } = useAuth()
  const { refreshPlans } = usePlans()
  const [status, setStatus] = useState('loading') // loading | error
  const [message, setMessage] = useState('')

  const normalizedToken = useMemo(() => String(token ?? '').trim(), [token])

  useEffect(() => {
    if (!normalizedToken) {
      setStatus('error')
      setMessage('Convite inválido.')
      return
    }

    if (!isAuthenticated || !accessToken) {
      navigate(ROUTES.login, {
        replace: true,
        state: {
          redirectTo: `/plans/invites/${normalizedToken}`,
          notice: 'Faça login para aceitar o convite.',
        },
      })
      return
    }

    let active = true

    async function accept() {
      setStatus('loading')
      setMessage('Aceitando convite...')

      try {
        const result = await apiRequest(`/api/plans/invites/${normalizedToken}/accept`, {
          method: 'POST',
          token: accessToken,
        })

        if (!active) return

        const planId = result?.planId ?? null
        if (!planId) {
          setStatus('error')
          setMessage('Não foi possível identificar o plano do convite.')
          return
        }

        await refreshPlans({ selectPlanId: planId }).catch(() => {})
        navigate(buildWorkspaceBoardPath(planId), { replace: true })
      } catch (error) {
        if (!active) return
        setStatus('error')
        setMessage(error?.message ?? 'Não foi possível aceitar este convite.')
      }
    }

    accept()

    return () => {
      active = false
    }
  }, [accessToken, isAuthenticated, navigate, normalizedToken, refreshPlans])

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link to={ROUTES.home} className={styles.logo}>
          <span className={styles.logoMark}><LogoMark /></span>
          <span className={styles.logoText}>Plan Things</span>
        </Link>
      </header>

      <main className={styles.center}>
        <section className={styles.card} aria-live="polite">
          <p className={styles.eyebrow}>Convite</p>
          <h1 className={styles.title}>{status === 'loading' ? 'Processando...' : 'Não foi possível'}</h1>
          <p className={styles.description}>{message}</p>

          {status === 'error' ? (
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => navigate(ROUTES.workspace, { replace: true })}>
                Ir para o workspace
              </button>
              <Link to={ROUTES.login} className={styles.link}>
                Trocar conta
              </Link>
            </div>
          ) : (
            <div className={styles.loadingBar} aria-hidden="true" />
          )}
        </section>
      </main>
    </div>
  )
}

