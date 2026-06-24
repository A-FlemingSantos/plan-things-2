import {
  ACCENT_BASE_COLOR_OPTIONS,
  ACCENT_EXTRA_COLOR_OPTIONS,
  normalizeAccentColor,
} from '../../../shared/config/accentColors.js'

export const KANBAN_LABEL_COLOR_OPTIONS = [
  { id: 'blue', label: 'Azul', value: '#2363eb' },
  { id: 'red', label: 'Vermelho', value: '#a90707' },
  { id: 'green', label: 'Verde', value: '#13442f' },
  { id: 'orange', label: 'Laranja', value: '#e24123' },
  { id: 'yellow', label: 'Amarelo', value: '#fade48' },
]

export const KANBAN_ADD_LIST_COLOR_OPTIONS = [
  { id: 'none', label: 'Sem cor', value: '' },
  ...KANBAN_LABEL_COLOR_OPTIONS,
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

export const KANBAN_ACCENT_BASE_COLOR_OPTIONS = ACCENT_BASE_COLOR_OPTIONS

export const KANBAN_ACCENT_EXTRA_COLOR_OPTIONS = ACCENT_EXTRA_COLOR_OPTIONS

export const normalizeKanbanAccentColor = normalizeAccentColor

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
