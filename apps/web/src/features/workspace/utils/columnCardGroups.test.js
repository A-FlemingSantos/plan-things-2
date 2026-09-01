import { describe, expect, it } from 'vitest'
import {
  buildColumnListSegments,
  canInsertColumnGroupAfter,
  collapsedCardIdsFromGroups,
  createColumnGroup,
  isCardInColumnGroup,
  nextCardIdAfter,
  removeColumnGroup,
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

  it('does not allow inserting a group between cards already inside a group', () => {
    const groups = [{ id: 'g1', startCardId: 'b', endCardId: 'd' }]

    expect(isCardInColumnGroup(cards, groups, 'a')).toBe(false)
    expect(isCardInColumnGroup(cards, groups, 'c')).toBe(true)
    expect(canInsertColumnGroupAfter(cards, groups, 'b')).toBe(false)
    expect(canInsertColumnGroupAfter(cards, groups, 'c')).toBe(false)
    expect(canInsertColumnGroupAfter(cards, groups, 'a')).toBe(false)
  })

  it('keeps each group to its start and end cards', () => {
    const segments = buildColumnListSegments(cards, [
      { id: 'g1', title: 'Meio', startCardId: 'b', endCardId: 'c' },
      { id: 'g2', title: 'Fim', startCardId: 'd', endCardId: 'd' },
    ])

    expect(segments).toEqual([
      { type: 'loose', cards: [cards[0]] },
      { type: 'group', group: expect.objectContaining({ id: 'g1', startCardId: 'b', endCardId: 'c' }), cards: [cards[1], cards[2]] },
      { type: 'group', group: expect.objectContaining({ id: 'g2', startCardId: 'd', endCardId: 'd' }), cards: [cards[3]] },
    ])
  })

  it('never splits the same group into two sections around a loose card', () => {
    const cardsWithLooseMiddle = [
      cards[0],
      cards[1],
      { id: 'outside', title: 'Fora' },
      cards[2],
      cards[3],
    ]
    const segments = buildColumnListSegments(cardsWithLooseMiddle, [{
      id: 'g1',
      title: 'Membros explícitos',
      startCardId: 'b',
      endCardId: 'c',
      cardIds: ['b', 'c'],
    }])

    expect(segments.filter((segment) => segment.type === 'group')).toHaveLength(1)
    expect(segments[1]).toEqual(expect.objectContaining({
      type: 'group',
      cards: [cards[1]],
    }))
    expect(segments.flatMap((segment) => (
      segment.type === 'loose' ? segment.cards.map((card) => card.id) : []
    ))).toEqual(expect.arrayContaining(['outside', 'c']))
  })

  it('leaves cards loose when a later group is removed', () => {
    const groups = [
      { id: 'g1', startCardId: 'b', endCardId: 'c' },
      { id: 'g2', startCardId: 'd', endCardId: 'd' },
    ]
    const next = removeColumnGroup(
      [{ id: 'col-1', cards, groups }],
      'col-1',
      'g2',
    )

    expect(buildColumnListSegments(next[0].cards, next[0].groups)).toEqual([
      { type: 'loose', cards: [cards[0]] },
      { type: 'group', group: expect.objectContaining({ id: 'g1' }), cards: [cards[1], cards[2]] },
      { type: 'loose', cards: [cards[3]] },
    ])
  })

  it('hides cards in collapsed groups', () => {
    const hidden = collapsedCardIdsFromGroups(cards, [
      { id: 'g1', startCardId: 'c', endCardId: 'd', collapsed: true },
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

  it('removes a group and leaves the cards in place', () => {
    const next = removeColumnGroup(
      [{
        id: 'col-1',
        cards,
        groups: [
          { id: 'g1', startCardId: 'b', title: 'Meio' },
          { id: 'g2', startCardId: 'd', title: 'Fim' },
        ],
      }],
      'col-1',
      'g1',
    )

    expect(next[0].cards).toEqual(cards)
    expect(next[0].groups).toEqual([expect.objectContaining({ id: 'g2' })])
  })
})
