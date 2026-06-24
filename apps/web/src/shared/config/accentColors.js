export const ACCENT_BASE_COLOR_OPTIONS = [
  { id: 'none', label: 'Padrão', value: '' },
  { id: 'gray', label: 'Cinza', value: '#a0a0a0' },
  { id: 'blue', label: 'Azul', value: '#4290da' },
  { id: 'purple', label: 'Roxo', value: '#d4aef1' },
  { id: 'green', label: 'Verde', value: '#0f703a' },
  { id: 'red', label: 'Vermelho', value: '#ff6766' },
  { id: 'orange', label: 'Laranja', value: '#f5a623' },
]

export const ACCENT_EXTRA_COLOR_OPTIONS = [
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

const KNOWN_ACCENT_COLORS = new Map(
  [...ACCENT_BASE_COLOR_OPTIONS, ...ACCENT_EXTRA_COLOR_OPTIONS]
    .filter((option) => option.value)
    .map((option) => [option.value.toLowerCase(), option.value]),
)

export function normalizeAccentColor(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!normalized) return ''
  return KNOWN_ACCENT_COLORS.get(normalized) ?? ''
}
