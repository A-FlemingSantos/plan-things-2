import { describe, expect, it } from 'vitest'
import {
  isReferenceUnavailable,
  resolveReferenceHref,
} from './referenceBlockUtils.js'

describe('referenceBlockUtils', () => {
  it('builds card href from entity and parent ids when href is missing', () => {
    expect(resolveReferenceHref({
      type: 'CARD_REFERENCE',
      entityId: 'card-1',
      payload: { parentEntityId: 'plan-1' },
    })).toBe('/workspace/board/plan-1?card=card-1')
  })

  it('detects unavailable references from snapshot', () => {
    expect(isReferenceUnavailable({
      type: 'PLAN_REFERENCE',
      snapshot: { unavailable: true, statusLabel: 'Indisponível' },
    })).toBe(true)
  })
})
