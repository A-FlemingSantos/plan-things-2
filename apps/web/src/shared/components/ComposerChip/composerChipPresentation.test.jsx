import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  CardChipIcon,
  COMPOSER_CHIP_KIND_CARD,
  buildCardContextChipType,
  resolveComposerChipIcon,
} from './composerChipPresentation.jsx'

const CustomIcon = () => <span data-testid="custom-icon" />

describe('composerChipPresentation', () => {
  it('builds stable card chip types from card ids', () => {
    expect(buildCardContextChipType('abc-123')).toBe('card-abc-123')
  })

  it('uses CardChipIcon for card chips without a custom icon', () => {
    const Icon = resolveComposerChipIcon({ kind: COMPOSER_CHIP_KIND_CARD, label: 'Login UI' })
    expect(Icon).toBe(CardChipIcon)
  })

  it('keeps a custom ChipIcon on card chips when provided', () => {
    const Icon = resolveComposerChipIcon({
      kind: COMPOSER_CHIP_KIND_CARD,
      ChipIcon: CustomIcon,
    })
    expect(Icon).toBe(CustomIcon)
  })

  it('returns null for non-card chips without ChipIcon', () => {
    expect(resolveComposerChipIcon({ kind: 'plan' })).toBeNull()
  })

  it('renders the card chip svg with title lines', () => {
    const { container } = render(<CardChipIcon />)
    expect(container.querySelector('svg rect')).toBeInTheDocument()
    expect(container.querySelectorAll('svg path')).toHaveLength(1)
  })

})
