import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { ROUTES } from '../../../../shared/config/routes.js'
import styles from './Auth.module.css'

/* ── OAuth provider icons ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="7.5" height="7.5" fill="#F25022"/>
      <rect x="9.5" y="1" width="7.5" height="7.5" fill="#7FBA00"/>
      <rect x="1" y="9.5" width="7.5" height="7.5" fill="#00A4EF"/>
      <rect x="9.5" y="9.5" width="7.5" height="7.5" fill="#FFB900"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}

/* ── Eye icons for password visibility ── */
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.5A2 2 0 0 0 9.5 9.5M4.5 4.5C2.5 5.8 1 8 1 8s2.5 5 7 5c1.3 0 2.5-.3 3.5-.9M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.4-2 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ── Logo mark ── */
function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2"  y="2"  width="7" height="7" rx="2" fill="currentColor" />
      <rect x="11" y="2"  width="7" height="7" rx="2" fill="currentColor" opacity=".35" />
      <rect x="2"  y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".55" />
      <rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity=".75" />
    </svg>
  )
}

/* ── Checkmark icon ── */
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 5.5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ── Main Auth page ── */
export default function Auth({ initialMode = 'login' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const [mode, setMode]           = useState(initialMode)   // 'login' | 'register'
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [name, setName]           = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [agree, setAgree]         = useState(false)
  const [loading, setLoading]     = useState(null)
  const [noticeMessage, setNoticeMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const isRegister = mode === 'register'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNoticeMessage('')
    setErrorMessage('')
    setLoading('email')

    try {
      if (isRegister) {
        await register({
          fullName: name,
          email,
          password,
        })
      } else {
        await login({
          email,
          password,
        })
      }

      navigate(ROUTES.workspace)
    } catch (error) {
      setErrorMessage(error.message ?? 'Nao foi possivel concluir a autenticacao.')
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = (provider) => {
    setNoticeMessage('')
    setErrorMessage('')
    setLoading(provider)
    setTimeout(() => {
      setErrorMessage(`Login com ${provider} ainda nao esta disponivel.`)
      setLoading(null)
    }, 800)
  }

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    setNoticeMessage(location.state?.notice ?? '')
  }, [location.state])

  const alternateHref = isRegister ? ROUTES.login : ROUTES.register

  return (
    <div className={styles.page}>

      {/* Background texture */}
      <div className={styles.bgNoise} aria-hidden />

      {/* Top bar */}
      <header className={styles.topBar}>
        <Link to={ROUTES.home} className={styles.logo}>
          <span className={styles.logoMark}><LogoMark /></span>
          <span className={styles.logoText}>Plan Things</span>
        </Link>

        <Link to={alternateHref} className={styles.modeToggleTop}>
          {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          <span className={styles.modeToggleAction}>
            {isRegister ? 'Entrar' : 'Cadastrar-se'}
          </span>
        </Link>
      </header>

      {/* Center form */}
      <main className={styles.center}>
        <div className={styles.formWrap}>

          {/* Heading */}
          <div className={styles.heading}>
            <p className={styles.eyebrow}>
              {isRegister ? 'Novo por aqui' : 'Bem-vindo de volta'}
            </p>
            <h1 className={styles.title}>
              {isRegister
                ? <>Crie sua conta<span className={styles.titleLight}>.</span></>
                : <>Entre na sua conta<span className={styles.titleLight}>.</span></>
              }
            </h1>
          </div>

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            {isRegister && (
              <div className={styles.field} key="name-field">
                <label className={styles.label} htmlFor="name">Nome completo</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Arthur Santos"
                  value={name}
                  onChange={e => setName(e.target.value)}
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
                placeholder="você@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                  placeholder={isRegister ? 'Mínimo 8 caracteres' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {isRegister && password.length > 0 && (
                <div className={styles.strengthRow}>
                  {['Fraca', 'Média', 'Forte'].map((s, i) => {
                    const score = password.length < 6 ? 0 : password.length < 10 ? 1 : 2
                    return (
                      <div key={s} className={`${styles.strengthBar} ${i <= score ? styles.strengthFill : ''}`}
                        style={{ '--fill-color': ['var(--color-red)', '#f5a623', 'var(--color-green)'][score] }}
                      />
                    )
                  })}
                  <span className={styles.strengthLabel}>
                    {password.length < 6 ? 'Fraca' : password.length < 10 ? 'Média' : 'Forte'}
                  </span>
                </div>
              )}
            </div>

            {isRegister && (
              <label className={styles.agreeRow}>
                <button
                  type="button"
                  className={`${styles.checkbox} ${agree ? styles.checkboxChecked : ''}`}
                  onClick={() => setAgree(v => !v)}
                  aria-checked={agree}
                  role="checkbox"
                >
                  {agree && <CheckIcon />}
                </button>
                <span className={styles.agreeText}>
                  Concordo com os{' '}
                  <Link to={ROUTES.terms} className={styles.agreeLink}>Termos de Uso</Link>
                  {' '}e a{' '}
                  <Link to={ROUTES.privacy} className={styles.agreeLink}>Política de Privacidade</Link>
                </span>
              </label>
            )}

            <button
              type="submit"
              className={`${styles.submitBtn} ${loading === 'email' ? styles.submitLoading : ''}`}
              disabled={!!loading || (isRegister && !agree)}
            >
              {loading === 'email'
                ? <span className={styles.spinner} />
                : isRegister ? 'Criar conta' : 'Continuar com e-mail'
              }
            </button>

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
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>ou continue com</span>
            <span className={styles.dividerLine} />
          </div>

          {/* OAuth buttons */}
          <div className={styles.oauthGroup}>
            {[
              { id: 'google',    label: 'Google',    Icon: GoogleIcon    },
              { id: 'microsoft', label: 'Microsoft',  Icon: MicrosoftIcon },
              { id: 'github',    label: 'GitHub',     Icon: GitHubIcon    },
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
                  : <span className={styles.oauthIcon}><Icon /></span>
                }
                <span className={styles.oauthLabel}>{label}</span>
              </button>
            ))}
          </div>

          {/* Mode switch — bottom */}
          <p className={styles.switchRow}>
            {isRegister ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
            {' '}
            <Link to={alternateHref} className={styles.switchBtn}>
              {isRegister ? 'Entrar' : 'Cadastrar-se'}
            </Link>
          </p>

        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Plan Things, Inc.</p>
        <div className={styles.footerLinks}>
          <Link to={ROUTES.privacy}>Privacidade</Link>
          <Link to={ROUTES.terms}>Termos</Link>
          <Link to={ROUTES.help}>Ajuda</Link>
        </div>
      </footer>
    </div>
  )
}
