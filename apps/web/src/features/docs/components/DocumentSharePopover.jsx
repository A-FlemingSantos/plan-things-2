import { useState } from 'react'
import { Copy, Link2 } from 'lucide-react'
import { useAuth } from '../../auth/context/AuthContext.jsx'
import { apiRequest } from '../../../shared/api/apiClient.js'

export default function DocumentSharePopover({
  document,
  onClose,
  onMembersChange,
  styles,
}) {
  const { accessToken } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('EDITOR')
  const [status, setStatus] = useState('')
  const canManage = document.document.role === 'OWNER'

  const invite = async () => {
    try {
      const result = await apiRequest(`/api/documents/${document.document.id}/invites`, {
        method: 'POST',
        token: accessToken,
        body: { email, role },
      })
      await navigator.clipboard?.writeText(result.inviteUrl)
      setStatus(
        result.delivery?.emailSent
          ? 'Convite enviado e link copiado.'
          : 'Link de convite copiado. Conecte o Gmail para enviar e-mails.',
      )
      setEmail('')
      onMembersChange?.()
    } catch (error) {
      setStatus(error?.message ?? 'Não foi possível criar o convite.')
    }
  }

  const updateRole = async (member, nextRole) => {
    try {
      await apiRequest(`/api/documents/${document.document.id}/members/${member.userId}`, {
        method: 'PATCH',
        token: accessToken,
        body: { role: nextRole },
      })
      onMembersChange?.()
    } catch (error) {
      setStatus(error?.message ?? 'Não foi possível alterar o acesso.')
    }
  }

  return (
    <div className={styles.documentSharePopover} role="dialog" aria-label="Compartilhar documento">
      <div className={styles.documentShareHeader}>
        <strong>Compartilhar</strong>
        <button type="button" className={styles.iconButton} aria-label="Fechar compartilhamento" onClick={onClose}>×</button>
      </div>
      {canManage ? (
        <div className={styles.documentShareInvite}>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" type="email" />
          <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Papel do convite">
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Leitor</option>
          </select>
          <button type="button" className={styles.documentShareButton} disabled={!email.trim()} onClick={invite}>
            <Link2 size={14} /> Convidar
          </button>
        </div>
      ) : null}
      {status ? <p className={styles.documentShareStatus}>{status}</p> : null}
      <ul className={styles.documentMemberList}>
        {document.members.map((member) => (
          <li key={member.userId} className={styles.documentMemberRow}>
            <span>{member.fullName}</span>
            {canManage && member.role !== 'OWNER' ? (
              <select value={member.role} onChange={(event) => updateRole(member, event.target.value)}>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Leitor</option>
              </select>
            ) : (
              <span>{member.role === 'OWNER' ? 'Proprietário' : member.role === 'EDITOR' ? 'Editor' : 'Leitor'}</span>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.documentShareCopy}
        onClick={() => navigator.clipboard?.writeText(window.location.href)}
      >
        <Copy size={14} /> Copiar link do documento
      </button>
    </div>
  )
}
