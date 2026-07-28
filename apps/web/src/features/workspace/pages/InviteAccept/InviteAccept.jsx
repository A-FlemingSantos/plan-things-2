import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { usePlans } from '../../context/PlansContext.jsx'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import { buildWorkspaceBoardPath, ROUTES } from '../../../../shared/config/routes.js'
import Loader from '../../../../shared/components/Loader/Loader.jsx'
import LoadingScreen from '../../../../shared/components/Loader/LoadingScreen.jsx'
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
  const [status, setStatus] = useState('loading') // loading | ready | accepted | declined | error
  const [message, setMessage] = useState('')
  const [invite, setInvite] = useState(null)
  const [submittingAction, setSubmittingAction] = useState('')

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

    async function loadInvite() {
      setStatus('loading')
      setMessage('Carregando convite...')

      try {
        const result = await apiRequest(`/api/plans/invites/${normalizedToken}`, {
          token: accessToken,
        })

        if (!active) return

        setInvite(result)
        if (result?.status !== 'PENDING') {
          setStatus('error')
          setMessage('Este convite não está mais disponível.')
          return
        }
        setStatus('ready')
        setMessage('Revise o convite antes de entrar no plano.')
      } catch (error) {
        if (!active) return
        setStatus('error')
        setMessage(error?.message ?? 'Não foi possível carregar este convite.')
      }
    }

    loadInvite()

    return () => {
      active = false
    }
  }, [accessToken, isAuthenticated, navigate, normalizedToken, refreshPlans])

  const acceptInvite = async () => {
    if (!normalizedToken || !accessToken) return

    setSubmittingAction('accept')
    setMessage('')
    try {
      const result = await apiRequest(`/api/plans/invites/${normalizedToken}/accept`, {
        method: 'POST',
        token: accessToken,
      })
      const planId = result?.planId ?? invite?.planId ?? null
      if (!planId) {
        setStatus('error')
        setMessage('Não foi possível identificar o plano do convite.')
        return
      }
      await refreshPlans({ selectPlanId: planId }).catch(() => {})
      setStatus('accepted')
      setMessage(result?.message ?? 'Convite aceito com sucesso.')
      navigate(buildWorkspaceBoardPath(planId), { replace: true })
    } catch (error) {
      setStatus('error')
      setMessage(error?.message ?? 'Não foi possível aceitar este convite.')
    } finally {
      setSubmittingAction('')
    }
  }

  const declineInvite = async () => {
    if (!normalizedToken || !accessToken) return

    setSubmittingAction('decline')
    setMessage('')
    try {
      const result = await apiRequest(`/api/plans/invites/${normalizedToken}/decline`, {
        method: 'POST',
        token: accessToken,
      })
      setStatus('declined')
      setMessage(result?.message ?? 'Convite recusado com sucesso.')
    } catch (error) {
      setStatus('error')
      setMessage(error?.message ?? 'Não foi possível recusar este convite.')
    } finally {
      setSubmittingAction('')
    }
  }

  return (
    <div className={styles.page}>
      {status === 'loading' ? (
        <LoadingScreen
          variant="fullscreen"
          label="Carregando convite..."
        />
      ) : (
        <>
          <header className={styles.topBar}>
            <Link to={ROUTES.home} className={styles.logo}>
              <span className={styles.logoMark}><LogoMark /></span>
              <span className={styles.logoText}>Plan Things</span>
            </Link>
          </header>

          <main className={styles.center}>
            <section className={styles.card} aria-live="polite">
              <p className={styles.eyebrow}>Convite</p>
              <h1 className={styles.title}>
                {status === 'ready'
                  ? invite?.planName ?? 'Entrar no plano'
                  : status === 'declined'
                    ? 'Convite recusado'
                    : status === 'accepted'
                      ? 'Convite aceito'
                      : 'Não foi possível'}
              </h1>
              <p className={styles.description}>{message}</p>

              {status === 'ready' ? (
                <div className={styles.inviteDetails}>
                  <div>
                    <span>Plano</span>
                    <strong>{invite?.planName ?? 'Plano compartilhado'}</strong>
                  </div>
                  <div>
                    <span>Enviado para</span>
                    <strong>{invite?.invitedEmail}</strong>
                  </div>
                  {invite?.expiresAt?.text ? (
                    <div>
                      <span>Expira em</span>
                      <strong>{invite.expiresAt.text}</strong>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {status === 'ready' ? (
                <div className={styles.actions}>
                  <button type="button" className={`${styles.primary} ${submittingAction === 'accept' ? styles.primaryLoading : ''}`} onClick={acceptInvite} disabled={Boolean(submittingAction)}>
                    {submittingAction === 'accept' ? (
                      <Loader size={16} label="Aceitar convite" className={styles.primaryBtnLoader} />
                    ) : 'Aceitar convite'}
                  </button>
                  <button type="button" className={`${styles.secondary} ${submittingAction === 'decline' ? styles.secondaryLoading : ''}`} onClick={declineInvite} disabled={Boolean(submittingAction)}>
                    {submittingAction === 'decline' ? (
                      <Loader size={16} label="Recusar" className={styles.secondaryBtnLoader} />
                    ) : 'Recusar'}
                  </button>
                </div>
              ) : status === 'error' || status === 'declined' ? (
                <div className={styles.actions}>
                  <button type="button" className={styles.primary} onClick={() => navigate(ROUTES.workspace, { replace: true })}>
                    Ir para o workspace
                  </button>
                  <Link to={ROUTES.login} className={styles.link}>
                    Trocar conta
                  </Link>
                </div>
              ) : null}
            </section>
          </main>
        </>
      )}
    </div>
  )
}
