import { useState } from 'react'
import shared from '../blocksShared.module.css'

const PROPOSAL_LABELS = {
  PLAN_PROPOSAL: 'Proposta de plano',
  CARD_BATCH_PROPOSAL: 'Proposta de cartões',
  MEMBER_INVITE_PROPOSAL: 'Convite de membro',
  FILE_ATTACH_PROPOSAL: 'Anexo de arquivo',
}

const DECISION_LABELS = {
  pending: 'Aguardando sua decisão',
  approved: 'Aprovada (simulação)',
  rejected: 'Rejeitada (simulação)',
}

function resolveProposalLabel(blockType) {
  return PROPOSAL_LABELS[blockType] ?? 'Proposta de ação'
}

export default function ActionProposalBlock({ block }) {
  const blockType = String(block?.type ?? '').toUpperCase()
  const payload = block?.payload ?? {}
  const preview = payload.preview && typeof payload.preview === 'object'
    ? payload.preview
    : {}
  const [decision, setDecision] = useState('pending')

  const title = String(preview.title ?? block?.title ?? resolveProposalLabel(blockType))
  const description = String(preview.description ?? '').trim()
  const highlights = Array.isArray(preview.highlights) ? preview.highlights : []

  return (
    <section
      className={shared.shell}
      data-block-kind="action-proposal"
      aria-label={resolveProposalLabel(blockType)}
    >
      <p className={shared.kicker}>{resolveProposalLabel(blockType)}</p>
      <p className={shared.title}>{title}</p>
      <span className={`${shared.badge} ${decision === 'pending' ? shared.badgeWarning : shared.badgeMuted}`}>
        {DECISION_LABELS[decision]}
      </span>
      {description ? <p className={shared.body}>{description}</p> : null}
      {highlights.length > 0 ? (
        <ul className={shared.list}>
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <p className={shared.mockNote}>
        Pré-visualização — aprovar ou rejeitar não altera dados reais do workspace.
      </p>
      <div className={shared.actions}>
        <button
          type="button"
          className={`${shared.button} ${shared.buttonPrimary}`}
          disabled={decision !== 'pending'}
          onClick={() => setDecision('approved')}
        >
          Aprovar
        </button>
        <button
          type="button"
          className={shared.button}
          disabled={decision !== 'pending'}
          onClick={() => setDecision('rejected')}
        >
          Rejeitar
        </button>
      </div>
    </section>
  )
}
