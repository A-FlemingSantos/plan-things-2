import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { readSessionModeFromAuthState } from '../../../auth/utils/sessionMode.js'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import { buildWorkspaceBoardPath } from '../../../../shared/config/routes.js'
import { usePlans } from '../../context/PlansContext.jsx'
import styles from './InviteNotifications.module.css'

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 6.8a4.5 4.5 0 0 1 9 0v2.7l1 1.7H2.5l1-1.7V6.8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.4 13a1.7 1.7 0 0 0 3.2 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function formatInviteStatus(status) {
  if (status === 'ACCEPTED') return 'Aceito'
  if (status === 'DECLINED') return 'Recusado'
  if (status === 'REVOKED') return 'Revogado'
  if (status === 'EXPIRED') return 'Expirado'
  return 'Pendente'
}

export default function InviteNotifications({
  wrapClassName = '',
  triggerClassName = '',
  badgeClassName = '',
  panelClassName = '',
}) {
  const navigate = useNavigate()
  const auth = useAuth()
  const { accessToken } = auth
  const { refreshPlans } = usePlans()
  const [open, setOpen] = useState(false)
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actingToken, setActingToken] = useState('')
  const wrapRef = useRef(null)
  const enabled = readSessionModeFromAuthState(auth) === 'authenticated' && accessToken

  const loadInvites = async () => {
    if (!enabled) {
      setInvites([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/api/plans/invites/pending', {
        token: accessToken,
      })
      setInvites(Array.isArray(result) ? result : [])
    } catch (loadError) {
      setError(loadError?.message ?? 'Não foi possível carregar os convites.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvites()
  }, [enabled, accessToken])

  useEffect(() => {
    if (!open) return

    const handleMouseDown = (event) => {
      if (wrapRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const acceptInvite = async (invite) => {
    if (!invite?.token || !enabled) return

    setActingToken(invite.token)
    setError('')
    try {
      const result = await apiRequest(`/api/plans/invites/${invite.token}/accept`, {
        method: 'POST',
        token: accessToken,
      })
      const planId = result?.planId ?? invite.planId
      await refreshPlans({ selectPlanId: planId }).catch(() => {})
      setInvites((current) => current.filter((item) => item.token !== invite.token))
      setOpen(false)
      navigate(buildWorkspaceBoardPath(planId))
    } catch (acceptError) {
      setError(acceptError?.message ?? 'Não foi possível aceitar este convite.')
      await loadInvites()
    } finally {
      setActingToken('')
    }
  }

  const declineInvite = async (invite) => {
    if (!invite?.token || !enabled) return

    setActingToken(invite.token)
    setError('')
    try {
      await apiRequest(`/api/plans/invites/${invite.token}/decline`, {
        method: 'POST',
        token: accessToken,
      })
      setInvites((current) => current.filter((item) => item.token !== invite.token))
    } catch (declineError) {
      setError(declineError?.message ?? 'Não foi possível recusar este convite.')
      await loadInvites()
    } finally {
      setActingToken('')
    }
  }

  const toggleOpen = () => {
    setOpen((value) => {
      const next = !value
      if (next) loadInvites()
      return next
    })
  }

  return (
    <div className={[styles.wrap, wrapClassName].filter(Boolean).join(' ')} ref={wrapRef}>
      <button
        type="button"
        className={[styles.trigger, triggerClassName].filter(Boolean).join(' ')}
        onClick={toggleOpen}
        aria-label={invites.length ? `${invites.length} convites pendentes` : 'Notificações'}
        aria-expanded={open ? 'true' : 'false'}
      >
        <BellIcon />
        {invites.length ? (
          <span className={[styles.badge, badgeClassName].filter(Boolean).join(' ')}>
            {invites.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={[styles.panel, panelClassName].filter(Boolean).join(' ')}
          role="dialog"
          aria-label="Notificações"
        >
          <div className={styles.header}>
            <div>
              <p className={styles.kicker}>Notificações</p>
              <h2 className={styles.title}>Convites pendentes</h2>
            </div>
            <button type="button" className={styles.refresh} onClick={loadInvites} disabled={loading}>
              Atualizar
            </button>
          </div>

          {loading ? (
            <p className={styles.state}>Carregando convites...</p>
          ) : error ? (
            <p className={styles.error}>{error}</p>
          ) : invites.length ? (
            <div className={styles.list}>
              {invites.map((invite) => {
                const acting = actingToken === invite.token
                return (
                  <article key={invite.inviteId ?? invite.token} className={styles.item}>
                    <div className={styles.itemMain}>
                      <span className={styles.itemIcon}>PT</span>
                      <div>
                        <p className={styles.itemTitle}>{invite.planName ?? 'Plano compartilhado'}</p>
                        <p className={styles.itemMeta}>
                          {formatInviteStatus(invite.status)}
                          {invite.expiresAt?.text ? ` · expira em ${invite.expiresAt.text}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <button type="button" className={styles.accept} onClick={() => acceptInvite(invite)} disabled={acting}>
                        {acting ? '...' : 'Aceitar'}
                      </button>
                      <button type="button" className={styles.decline} onClick={() => declineInvite(invite)} disabled={acting}>
                        Recusar
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className={styles.state}>Nenhum convite pendente.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
