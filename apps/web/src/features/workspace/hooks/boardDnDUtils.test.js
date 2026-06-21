import { describe, expect, it } from 'vitest'
import {
  findCardIndex,
  findColumnIdForItem,
  moveCardInColumns,
  moveCardToIndex,
  reorderCardWithinColumn,
} from './boardDnDUtils.js'

function buildColumns() {
  return [
    {
      id: 'col-1',
      title: 'Backlog',
      cards: [
        { id: 'card-1', title: 'Card 1', columnId: 'col-1' },
        { id: 'card-2', title: 'Card 2', columnId: 'col-1' },
        { id: 'card-3', title: 'Card 3', columnId: 'col-1' },
      ],
    },
    {
      id: 'col-2',
      title: 'Doing',
      cards: [
        { id: 'card-4', title: 'Card 4', columnId: 'col-2' },
      ],
    },
  ]
}

describe('boardDnDUtils', () => {
  it('finds the column that contains a card', () => {
    const columns = buildColumns()
    expect(findColumnIdForItem(columns, 'card-2')).toBe('col-1')
    expect(findColumnIdForItem(columns, 'col-2')).toBe('col-2')
  })

  it('moves a card to an explicit index in another column', () => {
    const columns = buildColumns()
    const nextColumns = moveCardToIndex(columns, 'card-1', 'col-1', 'col-2', 0)

    expect(nextColumns[0].cards.map((card) => card.id)).toEqual(['card-2', 'card-3'])
    expect(nextColumns[1].cards.map((card) => card.id)).toEqual(['card-1', 'card-4'])
    expect(nextColumns[1].cards[0].columnId).toBe('col-2')
  })

  it('reorders cards within the same column', () => {
    const columns = buildColumns()
    const nextColumns = reorderCardWithinColumn(columns, 'col-1', 0, 2)

    expect(nextColumns[0].cards.map((card) => card.id)).toEqual(['card-2', 'card-3', 'card-1'])
  })

  it('keeps legacy moveCardInColumns card targets working', () => {
    const columns = buildColumns()
    const nextColumns = moveCardInColumns(columns, 'card-3', 'col-1', {
      type: 'card',
      cardId: 'card-1',
      colId: 'col-1',
    })

    expect(nextColumns[0].cards.map((card) => card.id)).toEqual(['card-3', 'card-1', 'card-2'])
  })

  it('keeps legacy moveCardInColumns column targets appending to the end', () => {
    const columns = buildColumns()
    const nextColumns = moveCardInColumns(columns, 'card-1', 'col-1', {
      type: 'col',
      colId: 'col-2',
    })

    expect(nextColumns[1].cards.map((card) => card.id)).toEqual(['card-4', 'card-1'])
    expect(findCardIndex(nextColumns, 'col-2', 'card-1')).toBe(1)
  })
})
