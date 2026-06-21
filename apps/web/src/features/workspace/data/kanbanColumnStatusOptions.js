export const KANBAN_COLUMN_STATUS_OPTIONS = [
  { id: 'pending', label: 'Pendente', icon: 'CircleDashed', color: '#e88c30' },
  { id: 'planned', label: 'Planejado', icon: 'CircleDotDashed', color: 'var(--text-2)' },
  { id: 'in_progress', label: 'Em Progresso', icon: 'Loader', color: '#e8b923' },
  { id: 'completed', label: 'Concluído', icon: 'CircleCheckBig', color: '#4290da' },
  { id: 'canceled', label: 'Cancelado', icon: 'CircleX', color: 'var(--text-3)' },
]

export const KANBAN_DEFAULT_COLUMN_STATUS = KANBAN_COLUMN_STATUS_OPTIONS[0].id

export function resolveKanbanColumnStatus(statusId) {
  return KANBAN_COLUMN_STATUS_OPTIONS.find((option) => option.id === statusId)
    ?? KANBAN_COLUMN_STATUS_OPTIONS[0]
}
