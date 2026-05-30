import shared from '../blocksShared.module.css'

const STATUS_LABELS = {
  running: 'Em execução',
  completed: 'Concluída',
  failed: 'Falhou',
}

function resolveStatusLabel(status) {
  const key = String(status ?? '').trim().toLowerCase()
  return STATUS_LABELS[key] ?? status ?? 'Desconhecido'
}

function resolveStatusClass(status) {
  const key = String(status ?? '').trim().toLowerCase()
  if (key === 'completed') return shared.badgeSuccess
  if (key === 'running') return shared.badgeWarning
  return shared.badgeMuted
}

export default function ToolRunSummaryBlock({ block }) {
  const payload = block?.payload ?? {}
  const toolId = String(payload.toolId ?? block?.title ?? 'ferramenta')
  const summary = String(payload.summary ?? '').trim()
  const status = String(payload.status ?? 'completed')

  return (
    <section
      className={shared.shell}
      data-block-kind="tool-run"
      aria-label={`Ferramenta ${toolId}`}
    >
      <p className={shared.kicker}>Ferramenta</p>
      <p className={shared.title}>{toolId}</p>
      <span className={`${shared.badge} ${resolveStatusClass(status)}`}>
        {resolveStatusLabel(status)}
      </span>
      {summary ? <p className={shared.body}>{summary}</p> : null}
      <p className={shared.mockNote}>Simulação — nenhuma ferramenta foi executada no servidor.</p>
    </section>
  )
}
