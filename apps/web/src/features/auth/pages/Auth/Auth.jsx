import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { usePreferences } from '../../../preferences/context/PreferencesContext.jsx'
import { resolveAuthRedirectTarget, resolvePostAuthRoute } from '../../utils/authRedirect.js'
import { clearAuthIntent, persistAuthIntent } from '../../utils/authIntent.js'
import { ROUTES } from '../../../../shared/config/routes.js'
import BrandTypewriter from './BrandTypewriter.jsx'
import styles from './Auth.module.css'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="7.5" height="7.5" fill="#F25022" />
      <rect x="9.5" y="1" width="7.5" height="7.5" fill="#7FBA00" />
      <rect x="1" y="9.5" width="7.5" height="7.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.5A2 2 0 0 0 9.5 9.5M4.5 4.5C2.5 5.8 1 8 1 8s2.5 5 7 5c1.3 0 2.5-.3 3.5-.9M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.4-2 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1.4 17.1 5.35v9.3L10 18.6l-7.1-3.95v-9.3L10 1.4Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.6 8.1 10 10l3.4-1.9M10 10v4.2M6.6 8.1V12l3.4 2.2M13.4 8.1V12L10 14.2M6.6 8.1 10 5.95l3.4 2.15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 5.5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ToggleIcon({ enabled }) {
  return (
    <span className={`${styles.preferenceToggle} ${enabled ? styles.preferenceToggleEnabled : ''}`} aria-hidden>
      <span className={styles.preferenceThumb} />
    </span>
  )
}

export default function Auth({ initialMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, startOAuthLogin } = useAuth()
  const { resolveInitialRoute } = usePreferences()
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [agree, setAgree] = useState(false)
  const [receiveUpdates, setReceiveUpdates] = useState(false)
  const [loading, setLoading] = useState(null)
  const [noticeMessage, setNoticeMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const isRegister = mode === 'register'
  const authMode = location.state?.authMode === 'add-account' ? 'add-account' : 'default'
  const isAddAccountMode = authMode === 'add-account'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNoticeMessage('')
    setErrorMessage('')
    setLoading('email')

    try {
      clearAuthIntent()
      let session = null

      if (isRegister) {
        session = await register({
          fullName: name,
          email,
          password,
        }, { mode: authMode })
      } else {
        session = await login({
          email,
          password,
        }, { mode: authMode })
      }

      const redirectTo = resolvePostAuthRoute({
        authMode,
        redirectTo: location.state?.redirectTo,
        userId: session?.user?.id,
        resolveInitialRoute,
      })
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error.message ?? 'Nao foi possivel concluir a autenticacao.')
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = async (provider) => {
    setNoticeMessage('')
    setErrorMessage('')
    setLoading(provider)

    try {
      clearAuthIntent()
      const redirectTo = isAddAccountMode
        ? null
        : resolveAuthRedirectTarget(location.state?.redirectTo, null)
      if (isAddAccountMode) {
        persistAuthIntent({
          mode: authMode,
        })
      }

      const response = await startOAuthLogin(provider, {
        mode: authMode,
        ...(redirectTo ? { redirectTo } : {}),
      })

      window.location.assign(response.authorizationUrl)
    } catch (error) {
      setErrorMessage(error.message ?? `Nao foi possivel iniciar o login com ${provider}.`)
      setLoading(null)
    }
  }

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    setNoticeMessage(location.state?.notice ?? '')
  }, [location.state])

  const alternateHref = isRegister ? ROUTES.login : ROUTES.register
  const titleContent = isAddAccountMode
    ? (isRegister ? 'Crie outra conta' : 'Entre com outra conta')
    : (isRegister ? 'Crie sua conta' : 'Entre na sua conta')
  const eyebrowText = isAddAccountMode
    ? 'Adicionar conta'
    : (isRegister ? 'Primeiro acesso' : 'Bem-vindo de volta')
  const subtitleText = isRegister
    ? 'Centralize tarefas, arquivos e rotinas da equipe em um unico espaco organizado.'
    : 'Use seu email corporativo ou um provedor conectado para retomar seu trabalho.'

  return (
    <div className={styles.page}>
      <div className={styles.pageGlow} aria-hidden />

      <main className={styles.shell}>
        <section className={styles.brandPanel}>
          <div className={styles.brandBadge}>
            <span className={styles.brandBadgeMark}><LogoMark /></span>
            <span className={styles.brandBadgeText}>Plan Things</span>
          </div>

          <div className={styles.brandTypewriterSlot}>
            <BrandTypewriter />
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formIntro}>
            <p className={styles.eyebrow}>{eyebrowText}</p>
            <h1 className={styles.title}>{titleContent}</h1>
            <p className={styles.subtitle}>{subtitleText}</p>
          </div>

          <div className={styles.oauthGroup}>
            {[
              { id: 'google', label: 'Google', Icon: GoogleIcon },
              { id: 'microsoft', label: 'Microsoft', Icon: MicrosoftIcon },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`${styles.oauthBtn} ${loading === id ? styles.oauthLoading : ''}`}
                onClick={() => handleOAuth(id)}
                disabled={!!loading}
              >
                {loading === id
                  ? <span className={styles.spinnerSmall} />
                  : <span className={styles.oauthIcon}><Icon /></span>}
                <span>{`Continuar com ${label}`}</span>
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Nome completo</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Arthur Santos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="password">Senha</label>
                {!isRegister && (
                  <Link to={ROUTES.forgot} className={styles.forgotLink}>Esqueceu a senha?</Link>
                )}
              </div>

              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder={isRegister ? 'Minimo de 8 caracteres' : 'Digite sua senha'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass((value) => !value)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="button"
              className={styles.preferenceRow}
              onClick={() => setReceiveUpdates((value) => !value)}
              aria-pressed={receiveUpdates}
            >
              <span className={styles.preferenceTextGroup}>
                <span className={styles.preferenceTitle}>Receber novidades</span>
                <span className={styles.preferenceHint}>Dicas de planejamento, atualizacoes e novas automacoes.</span>
              </span>
              <ToggleIcon enabled={receiveUpdates} />
            </button>

            {isRegister && (
              <label className={styles.agreeRow}>
                <button
                  type="button"
                  className={`${styles.checkbox} ${agree ? styles.checkboxChecked : ''}`}
                  onClick={() => setAgree((value) => !value)}
                  aria-checked={agree}
                  role="checkbox"
                >
                  {agree && <CheckIcon />}
                </button>
                <span className={styles.agreeText}>
                  Concordo com os{' '}
                  <Link to={ROUTES.terms} className={styles.agreeLink}>Termos de Uso</Link>
                  {' '}e a{' '}
                  <Link to={ROUTES.privacy} className={styles.agreeLink}>Politica de Privacidade</Link>
                </span>
              </label>
            )}

            {noticeMessage && (
              <p className={styles.formNotice} role="status">
                {noticeMessage}
              </p>
            )}

            {errorMessage && (
              <p className={styles.formHint} role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className={`${styles.submitBtn} ${loading === 'email' ? styles.submitLoading : ''}`}
              disabled={!!loading || (isRegister && !agree)}
            >
              {loading === 'email'
                ? <span className={styles.spinner} />
                : (isRegister ? 'Criar conta' : 'Continuar com e-mail')}
            </button>
          </form>

          <p className={styles.switchRow}>
            {isRegister ? 'Ja tem uma conta?' : 'Ainda nao tem uma conta?'}
            {' '}
            <Link to={alternateHref} className={styles.switchBtn} state={location.state}>
              {isRegister ? 'Entrar agora' : 'Cadastrar-se'}
            </Link>
          </p>

          <p className={styles.legalText}>
            Plan Things • Design system interno • Todos os direitos reservados.
          </p>
        </section>
      </main>
    </div>
  )
}
