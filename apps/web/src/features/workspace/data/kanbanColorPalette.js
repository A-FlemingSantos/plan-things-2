export const KANBAN_LABEL_COLOR_OPTIONS = [
  { id: 'blue', label: 'Azul', value: '#2363eb' },
  { id: 'red', label: 'Vermelho', value: '#a90707' },
  { id: 'green', label: 'Verde', value: '#13442f' },
  { id: 'orange', label: 'Laranja', value: '#e24123' },
  { id: 'yellow', label: 'Amarelo', value: '#fade48' },
]

export const KANBAN_DEFAULT_LABELS = [
  { id: 'l1', text: 'Design', color: '#fade48' },
  { id: 'l2', text: 'Engenharia', color: '#2363eb' },
  { id: 'l3', text: 'Pesquisa', color: '#e24123' },
  { id: 'l4', text: 'Marketing', color: '#a90707' },
  { id: 'l5', text: 'QA', color: '#13442f' },
]

const KANBAN_BASE_COLOR_DEFINITIONS = [
  { id: 'none', columnLabel: 'Sem cor', preferenceLabel: 'Padrão', value: '' },
  { id: 'gray', columnLabel: 'Cinza', preferenceLabel: 'Cinza', value: '#a0a0a0' },
  { id: 'blue', columnLabel: 'Azul', preferenceLabel: 'Azul', value: '#4290da' },
  { id: 'purple', columnLabel: 'Roxo', preferenceLabel: 'Roxo', value: '#d4aef1' },
  { id: 'green', columnLabel: 'Verde', preferenceLabel: 'Verde', value: '#0f703a' },
  { id: 'red', columnLabel: 'Vermelho', preferenceLabel: 'Vermelho', value: '#ff6766' },
  { id: 'orange', columnLabel: 'Laranja', preferenceLabel: 'Laranja', value: '#f5a623' },
]

export const KANBAN_COLUMN_COLOR_OPTIONS = KANBAN_BASE_COLOR_DEFINITIONS.map((option) => ({
  id: option.id,
  label: option.columnLabel,
  value: option.value,
}))

export const KANBAN_ACCENT_BASE_COLOR_OPTIONS = KANBAN_BASE_COLOR_DEFINITIONS.map((option) => ({
  id: option.id,
  label: option.preferenceLabel,
  value: option.value,
}))

export const KANBAN_ACCENT_EXTRA_COLOR_OPTIONS = [
  { id: 'teal', label: 'Turquesa', value: '#14b8a6' },
  { id: 'cyan', label: 'Ciano', value: '#06b6d4' },
  { id: 'indigo', label: 'Índigo', value: '#6366f1' },
  { id: 'violet', label: 'Violeta', value: '#8b5cf6' },
  { id: 'pink', label: 'Rosa', value: '#ec4899' },
  { id: 'rose', label: 'Rosa queimado', value: '#f43f5e' },
  { id: 'amber', label: 'Âmbar', value: '#f59e0b' },
  { id: 'yellow', label: 'Amarelo', value: '#eab308' },
  { id: 'lime', label: 'Lima', value: '#84cc16' },
  { id: 'emerald', label: 'Esmeralda', value: '#10b981' },
  { id: 'sky', label: 'Azul céu', value: '#0ea5e9' },
  { id: 'slate', label: 'Ardósia', value: '#64748b' },
]

const KNOWN_KANBAN_ACCENT_COLORS = new Map(
  [...KANBAN_ACCENT_BASE_COLOR_OPTIONS, ...KANBAN_ACCENT_EXTRA_COLOR_OPTIONS]
    .filter((option) => option.value)
    .map((option) => [option.value.toLowerCase(), option.value]),
)

export function normalizeKanbanAccentColor(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!normalized) return ''
  return KNOWN_KANBAN_ACCENT_COLORS.get(normalized) ?? ''
}

export function resolveKanbanAccentColor(value) {
  const normalized = normalizeKanbanAccentColor(value)
  return normalized || 'var(--kanban-neutral-accent)'
}

export function isKanbanAccentBaseColor(value) {
  const normalized = normalizeKanbanAccentColor(value)
  return KANBAN_ACCENT_BASE_COLOR_OPTIONS.some((option) => option.value === normalized)
}

export function resolveKanbanAccentForeground(value) {
  const normalized = normalizeKanbanAccentColor(value)
  if (!normalized) return 'var(--kanban-neutral-accent-foreground)'

  const hex = normalized.replace('#', '')
  const expanded = hex.length === 3
    ? hex.split('').map((char) => `${char}${char}`).join('')
    : hex

  if (expanded.length !== 6) return 'var(--text-on-accent)'

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
  return luminance > 0.62 ? 'var(--color-black)' : 'var(--color-white)'
}
