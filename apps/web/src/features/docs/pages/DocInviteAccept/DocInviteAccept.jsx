import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppThemeScope from '../../../preferences/components/AppThemeScope/AppThemeScope.jsx'
import ProductAppShell from '../../../../shared/components/ProductAppShell/ProductAppShell.jsx'
import { useAuth } from '../../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../../shared/api/apiClient.js'
import { buildDocsPath, ROUTES } from '../../../../shared/config/routes.js'

export default function DocInviteAccept() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    apiRequest(`/api/documents/invites/${token}`, { token: accessToken })
      .then((nextInvite) => {
        if (active) setInvite(nextInvite)
      })
      .catch((nextError) => {
        if (active) setError(nextError?.message ?? 'Não foi possível carregar o convite.')
      })
    return () => { active = false }
  }, [accessToken, token])

  const respond = async (action) => {
    setIsSubmitting(true)
    try {
      const result = await apiRequest(`/api/documents/invites/${token}/${action}`, {
        method: 'POST',
        token: accessToken,
      })
      if (action === 'accept') navigate(buildDocsPath(result.documentId), { replace: true })
      else navigate(ROUTES.docs, { replace: true })
    } catch (nextError) {
      setError(nextError?.message ?? 'Não foi possível responder ao convite.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppThemeScope preference="system">
      <ProductAppShell contentTag="main">
        <section style={{ maxWidth: 520, margin: '10vh auto', padding: 24 }}>
          <Link to={ROUTES.docs}>Voltar para Docs</Link>
          <h1>{invite ? `Convite para “${invite.documentTitle}”` : 'Convite para documento'}</h1>
          {error ? <p>{error}</p> : null}
          {!invite && !error ? <p>Carregando convite…</p> : null}
          {invite ? (
            <>
              <p>Você receberá acesso como {invite.role === 'EDITOR' ? 'editor' : 'leitor'}.</p>
              <button type="button" disabled={isSubmitting} onClick={() => respond('accept')}>Aceitar</button>
              <button type="button" disabled={isSubmitting} onClick={() => respond('decline')}>Recusar</button>
            </>
          ) : null}
        </section>
      </ProductAppShell>
    </AppThemeScope>
  )
}
