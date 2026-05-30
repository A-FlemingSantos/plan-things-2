export const COMPOSER_CHIP_KIND_CARD = 'card'

export function buildCardContextChipType(cardId) {
  return `card-${cardId}`
}

/** Kanban card context chip icon (12×12, currentColor). */
export function CardChipIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="9" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.5 5h5M3.5 6.75h3.25" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function resolveComposerChipIcon(chip) {
  if (chip?.kind === COMPOSER_CHIP_KIND_CARD) {
    return chip.ChipIcon ?? CardChipIcon
  }
  return chip?.ChipIcon ?? null
}
