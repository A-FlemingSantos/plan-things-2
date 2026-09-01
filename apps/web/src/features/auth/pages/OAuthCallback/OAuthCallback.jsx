import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
      const failureMessage = error.message ?? 'Nao foi possivel concluir o login externo.'

      if (finishPopupOAuth({
        success: false,
        error: failureMessage,
      })) {
        return
      }

      navigate(ROUTES.login, {
        replace: true,
        state: { error: failureMessage },
      })
    }).finally(() => {
      clearAuthIntent()
    })
  }, [completeOAuthLogin, location.search, navigate, resolveInitialRoute])

  return (
    <LoadingScreen
      variant="fullscreen"
      label="Concluindo login..."
    />
  )
}
