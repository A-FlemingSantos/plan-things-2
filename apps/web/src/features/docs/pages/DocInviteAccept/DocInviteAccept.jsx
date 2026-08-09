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
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('Carregando convite…')

  useEffect(() => {
    if (!token || !accessToken) return undefined

    let active = true

    async function openInvite() {
      setError('')
      setStatusMessage('Carregando convite…')

      try {
        const invite = await apiRequest(`/api/documents/invites/${token}`, { token: accessToken })
        if (!active) return

        if (invite?.status === 'ACCEPTED' && invite.documentId) {
          navigate(buildDocsPath(invite.documentId), { replace: true })
          return
        }

        if (invite?.status !== 'PENDING') {
          setError('Este convite não está mais disponível.')
          setStatusMessage('')
          return
        }

        setStatusMessage('Abrindo documento…')
        const result = await apiRequest(`/api/documents/invites/${token}/accept`, {
          method: 'POST',
          token: accessToken,
        })
        if (!active) return

        const documentId = result?.documentId ?? invite.documentId
        if (!documentId) {
          setError('Não foi possível identificar o documento do convite.')
          setStatusMessage('')
          return
        }

        navigate(buildDocsPath(documentId), { replace: true })
      } catch (nextError) {
        if (!active) return
        setError(nextError?.message ?? 'Não foi possível aceitar o convite.')
        setStatusMessage('')
      }
    }

    openInvite()

    return () => {
      active = false
    }
  }, [accessToken, navigate, token])

  return (
    <AppThemeScope preference="system">
      <ProductAppShell contentTag="main">
        <section style={{ maxWidth: 520, margin: '10vh auto', padding: 24 }}>
          <Link to={ROUTES.docs}>Voltar para Docs</Link>
          <h1>Convite para documento</h1>
          {error ? <p>{error}</p> : null}
          {!error && statusMessage ? <p>{statusMessage}</p> : null}
        </section>
      </ProductAppShell>
    </AppThemeScope>
  )
}
