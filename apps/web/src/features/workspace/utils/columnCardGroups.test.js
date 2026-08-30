import { describe, expect, it } from 'vitest'
import {
  buildColumnListSegments,
  canInsertColumnGroupAfter,
  collapsedCardIdsFromGroups,
  createColumnGroup,
  nextCardIdAfter,
  upsertColumnGroup,
} from './columnCardGroups.js'

const cards = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
  { id: 'd', title: 'D' },
]

describe('columnCardGroups', () => {
  it('creates a group starting at the card below the insert gap', () => {
    expect(nextCardIdAfter(cards, 'b')).toBe('c')
    expect(canInsertColumnGroupAfter(cards, [], 'b')).toBe(true)
    expect(canInsertColumnGroupAfter(cards, [{ id: 'g1', startCardId: 'c' }], 'b')).toBe(false)
    expect(canInsertColumnGroupAfter(cards, [], 'd')).toBe(false)
  })

  it('wraps every card below a divider until the next divider', () => {
    const segments = buildColumnListSegments(cards, [
      { id: 'g1', title: 'Meio', startCardId: 'b' },
      { id: 'g2', title: 'Fim', startCardId: 'd' },
    ])

    expect(segments).toEqual([
      { type: 'loose', cards: [cards[0]] },
      { type: 'group', group: expect.objectContaining({ id: 'g1', startCardId: 'b' }), cards: [cards[1], cards[2]] },
      { type: 'group', group: expect.objectContaining({ id: 'g2', startCardId: 'd' }), cards: [cards[3]] },
    ])
  })

  it('hides cards in collapsed groups', () => {
    const hidden = collapsedCardIdsFromGroups(cards, [
      { id: 'g1', startCardId: 'c', collapsed: true },
    ])

    expect([...hidden]).toEqual(['c', 'd'])
  })

  it('upserts a group onto a column without duplicating the same start card', () => {
    const group = createColumnGroup({ startCardId: 'c', title: 'Sprint' })
    const next = upsertColumnGroup(
      [{ id: 'col-1', cards, groups: [] }],
      'col-1',
      group,
    )

    expect(next[0].groups).toEqual([expect.objectContaining({ startCardId: 'c', title: 'Sprint' })])
  })
})
