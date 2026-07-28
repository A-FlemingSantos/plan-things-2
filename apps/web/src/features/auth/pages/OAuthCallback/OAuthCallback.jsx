import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import { resolveAuthRedirectTarget, resolvePostAuthRoute } from '../../utils/authRedirect.js'
import { clearAuthIntent, readAuthIntent } from '../../utils/authIntent.js'
import { isOAuthPopupContext, postOAuthPopupResult } from '../../utils/oauthPopup.js'
import { ROUTES } from '../../../../shared/config/routes.js'
import LoadingScreen from '../../../../shared/components/Loader/LoadingScreen.jsx'

export default function OAuthCallback() {
  const location = useLocation()
  const navigate = useNavigate()
  const { completeOAuthLogin } = useAuth()
  const { resolveInitialRoute } = usePreferences()
  const [message, setMessage] = useState('Concluindo login...')
  const [failed, setFailed] = useState(false)
  const hasCompletedRef = useRef(false)

  useEffect(() => {
    if (hasCompletedRef.current) return
    hasCompletedRef.current = true

    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const error = params.get('error')
    const storedIntent = readAuthIntent()
    const authMode = storedIntent?.mode === 'add-account' ? 'add-account' : 'default'
    const redirectTo = resolveAuthRedirectTarget(
      params.get('redirectTo'),
      resolveAuthRedirectTarget(storedIntent?.redirectTo, null),
    )

    function finishPopupOAuth(result) {
      if (!isOAuthPopupContext()) {
        return false
      }

      postOAuthPopupResult(result)
      window.close()
      return true
    }

    async function completeLogin() {
      if (error) {
        throw new Error('Nao foi possivel concluir o login externo.')
      }
      if (!code) {
        throw new Error('Codigo de conclusao ausente.')
      }

      const session = await completeOAuthLogin(code, {
        mode: authMode,
      })

      const nextRoute = resolvePostAuthRoute({
        authMode,
        redirectTo,
        userId: session?.user?.id,
        resolveInitialRoute,
      })

      if (finishPopupOAuth({
        success: true,
        authMode,
        redirectTo: nextRoute,
        userId: session?.user?.id,
      })) {
        return
      }

      navigate(nextRoute, { replace: true })
    }

    completeLogin().catch((error) => {
      const message = error.message ?? 'Nao foi possivel concluir o login externo.'

      if (finishPopupOAuth({
        success: false,
        error: message,
      })) {
        return
      }

      setMessage(message)
      setFailed(true)
    }).finally(() => {
      clearAuthIntent()
    })
  }, [completeOAuthLogin, location.search, navigate, resolveInitialRoute])

  if (failed) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '32px',
          background: 'linear-gradient(180deg, var(--surface-2) 0%, var(--app-bg) 100%)',
          color: 'var(--text-1)',
        }}
      >
        <section style={{ maxWidth: '420px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{message}</p>
          <p style={{ margin: '16px 0 0' }}>
            <Link to={ROUTES.login}>Voltar ao login</Link>
          </p>
        </section>
      </main>
    )
  }

  return (
    <LoadingScreen
      variant="fullscreen"
      label={message}
    />
  )
}
