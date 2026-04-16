import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './PasswordRecovery.module.css'

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

export default function PasswordRecovery({ mode = 'forgot' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { forgotPassword, resetPassword } = useAuth()
  const isForgot = mode === 'forgot'

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const heading = useMemo(() => (
    isForgot ? 'Recupere sua senha' : 'Redefina sua senha'
  ), [isForgot])

  useEffect(() => {
    if (!isForgot) {
      const tokenFromQuery = searchParams.get('token') ?? ''
      const tokenFromState = location.state?.token ?? ''
      setToken(tokenFromQuery || tokenFromState)
      setNotice(location.state?.notice ?? '')
      return
    }

    setNotice('')
  }, [isForgot, location.state, searchParams])

  const submitForgot = async (event) => {
    event.preventDefault()
    if (!email.trim() || isSubmitting) return

    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      const response = await forgotPassword(email.trim())
      const resetToken = response?.resetToken ?? ''
      const query = resetToken ? `?token=${encodeURIComponent(resetToken)}` : ''
      navigate(`${ROUTES.reset}${query}`, {
        replace: true,
        state: {
          token: resetToken,
          notice: response?.message ?? '',
        },
      })
    } catch (requestError) {
      setError(requestError?.message ?? 'Não foi possível iniciar a recuperação da senha.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitReset = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const normalizedToken = token.trim()
    if (!normalizedToken) {
      setError('Informe o token de recuperação para redefinir a senha.')
      return
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha precisa ser igual à nova senha.')
      return
    }

    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      const response = await resetPassword(normalizedToken, newPassword)
      navigate(ROUTES.login, {
        replace: true,
        state: {
          notice: response?.message ?? 'Senha redefinida com sucesso.',
        },
      })
    } catch (requestError) {
      setError(requestError?.message ?? 'Não foi possível redefinir a senha com este token.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <Link to={ROUTES.home} className={styles.logo}>
          <span className={styles.logoMark}><LogoMark /></span>
          <span className={styles.logoText}>Plan Things</span>
        </Link>
      </header>

      <main className={styles.center}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Acesso</p>
          <h1>{heading}</h1>
          <p className={styles.description}>
            {isForgot
              ? 'Informe seu e-mail para gerar o token de recuperação.'
              : 'Use o token de recuperação e defina uma nova senha.'}
          </p>

          <form className={styles.form} onSubmit={isForgot ? submitForgot : submitReset} noValidate>
            {isForgot ? (
              <label className={styles.field}>
                <span>E-mail</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            ) : (
              <>
                <label className={styles.field}>
                  <span>Token</span>
                  <input
                    type="text"
                    placeholder="Cole o token de recuperação"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Nova senha</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Confirmar nova senha</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              </>
            )}

            {notice && <p className={styles.notice} role="status">{notice}</p>}
            {error && <p className={styles.error} role="alert">{error}</p>}

            <button
              type="submit"
              className={styles.submit}
              disabled={isSubmitting || (isForgot ? !email.trim() : (!token.trim() || !newPassword || !confirmPassword))}
            >
              {isSubmitting
                ? (isForgot ? 'Gerando token...' : 'Redefinindo senha...')
                : (isForgot ? 'Continuar' : 'Salvar nova senha')}
            </button>
          </form>

          <div className={styles.links}>
            <Link to={ROUTES.login}>Voltar ao login</Link>
            {isForgot ? <Link to={ROUTES.register}>Criar conta</Link> : <Link to={ROUTES.forgot}>Gerar novo token</Link>}
          </div>
        </section>
      </main>
    </div>
  )
}
